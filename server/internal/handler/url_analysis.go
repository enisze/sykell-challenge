package handler

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sykell-challenge/server/internal/models"
	"github.com/sykell-challenge/server/internal/services"
	"github.com/sykell-challenge/server/internal/types"
	"golang.org/x/net/html"
)

type URLAnalysisRequest struct {
	URL string `json:"url" binding:"required"`
}

type URLAnalysisResponse struct {
	types.BaseURLAnalysisData
	HeadingCounts      map[string]int         `json:"headingCounts"`
	BrokenLinkDetails  []models.BrokenLink    `json:"brokenLinkDetails"`
}

func AnalyzeURL(c *gin.Context) {
	var req URLAnalysisRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	urlService := services.NewURLAnalysisService()
	
	existingAnalysis, err := urlService.GetAnalysisByURL(req.URL)
	if err == nil && existingAnalysis != nil {
		result := convertFromDBModel(existingAnalysis)
		c.JSON(http.StatusOK, result)
		return
	}
	
	result := analyzeURL(req.URL)
	
	if result.Error == "" {
		dbAnalysis := convertToDBModel(result)
		urlService.SaveAnalysis(dbAnalysis)
	}

	c.JSON(http.StatusOK, result)
}

func analyzeURL(urlStr string) URLAnalysisResponse {
	result := URLAnalysisResponse{
		BaseURLAnalysisData: types.BaseURLAnalysisData{
			URL:         urlStr,
			HTMLVersion: "HTML5",
		},
		HeadingCounts:     make(map[string]int),
		BrokenLinkDetails: make([]models.BrokenLink, 0),
	}

	client := &http.Client{
		Timeout: 15 * time.Second,
		Transport: &http.Transport{
			TLSHandshakeTimeout:   10 * time.Second,
			ResponseHeaderTimeout: 10 * time.Second,
			IdleConnTimeout:       30 * time.Second,
		},
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 5 {
				return http.ErrUseLastResponse
			}
			return nil
		},
	}
	
	body, err := fetchWebpage(client, urlStr)
	if err != nil {
		result.Error = err.Error()
		return result
	}

	doc, err := html.Parse(strings.NewReader(body))
	if err != nil {
		result.Error = fmt.Sprintf("Failed to parse HTML: %v", err)
		return result
	}

	parsedURL, _ := url.Parse(urlStr)
	baseHost := parsedURL.Host

	analyzeHTML(doc, &result, baseHost, client)

	return result
}

func fetchWebpage(client *http.Client, urlStr string) (string, error) {
	resp, err := client.Get(urlStr)
	if err != nil {
		return "", fmt.Errorf("failed to fetch URL: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("HTTP error: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %v", err)
	}

	return string(body), nil
}

func analyzeHTML(n *html.Node, result *URLAnalysisResponse, baseHost string, client *http.Client) {
	if n.Type == html.ElementNode {
		switch strings.ToLower(n.Data) {
		case "title":
			if isInHeadElement(n) && n.FirstChild != nil && n.FirstChild.Type == html.TextNode {
				result.PageTitle = strings.TrimSpace(n.FirstChild.Data)
			}
		case "h1", "h2", "h3", "h4", "h5", "h6":
			result.HeadingCounts[strings.ToUpper(n.Data)]++
		case "a":
			processLink(n, result, baseHost, client)
		case "form":
			if hasPasswordInput(n) {
				result.HasLoginForm = true
			}
		}
	}

	if n.Type == html.DoctypeNode {
		result.HTMLVersion = parseHTMLVersion(n.Data)
	}

	for c := n.FirstChild; c != nil; c = c.NextSibling {
		analyzeHTML(c, result, baseHost, client)
	}
}

func isInHeadElement(n *html.Node) bool {
	for parent := n.Parent; parent != nil; parent = parent.Parent {
		if parent.Type == html.ElementNode && strings.ToLower(parent.Data) == "head" {
			return true
		}
	}
	return false
}

func processLink(n *html.Node, result *URLAnalysisResponse, baseHost string, client *http.Client) {
	for _, attr := range n.Attr {
		if attr.Key == "href" {
			href := attr.Val
			if href == "" || strings.HasPrefix(href, "#") || 
				strings.HasPrefix(href, "javascript:") || 
				strings.HasPrefix(href, "mailto:") {
				return
			}

			linkURL, err := url.Parse(href)
			if err != nil {
				return
			}

			var fullURL string
			if linkURL.IsAbs() {
				fullURL = href
			} else {
				baseURL := &url.URL{Scheme: "http", Host: baseHost}
				fullURL = baseURL.ResolveReference(linkURL).String()
			}

			if linkURL.Host == "" || linkURL.Host == baseHost {
				result.InternalLinks++
			} else {
				result.ExternalLinks++
			}

			checkLinkStatus(fullURL, result, client)
			break
		}
	}
}

func checkLinkStatus(linkURL string, result *URLAnalysisResponse, client *http.Client) {
	addBrokenLink := func(statusCode int, errMsg string) {
		result.BrokenLinkDetails = append(result.BrokenLinkDetails, models.BrokenLink{
			URL:        linkURL,
			StatusCode: statusCode,
			Error:      errMsg,
		})
		result.BaseURLAnalysisData.BrokenLinks++
	}

	req, err := http.NewRequest("HEAD", linkURL, nil)
	if err != nil {
		addBrokenLink(0, fmt.Sprintf("Failed to create request: %v", err))
		return
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; URL-Analyzer/1.0)")

	resp, err := client.Do(req)
	if err != nil {
		// If HEAD fails, try GET request
		getReq, getErr := http.NewRequest("GET", linkURL, nil)
		if getErr != nil {
			addBrokenLink(0, fmt.Sprintf("Request failed: %v", getErr))
			return
		}

		getReq.Header.Set("User-Agent", "Mozilla/5.0 (compatible; URL-Analyzer/1.0)")
		getResp, getErr := client.Do(getReq)
		if getErr != nil {
			addBrokenLink(0, fmt.Sprintf("Request failed: %v", getErr))
			return
		}
		defer getResp.Body.Close()
		resp = getResp
	} else {
		defer resp.Body.Close()
	}

	if resp.StatusCode >= 400 {
		addBrokenLink(resp.StatusCode, fmt.Sprintf("HTTP error: %d %s", resp.StatusCode, http.StatusText(resp.StatusCode)))
	}
}

func hasPasswordInput(n *html.Node) bool {
	if n.Type == html.ElementNode && strings.ToLower(n.Data) == "input" {
		for _, attr := range n.Attr {
			if attr.Key == "type" && strings.ToLower(attr.Val) == "password" {
				return true
			}
		}
	}

	for c := n.FirstChild; c != nil; c = c.NextSibling {
		if hasPasswordInput(c) {
			return true
		}
	}
	return false
}

func parseHTMLVersion(doctype string) string {
	doctype = strings.ToLower(doctype)
	if strings.Contains(doctype, "4.01") {
		return "HTML 4.01"
	} else if strings.Contains(doctype, "xhtml") {
		return "XHTML"
	}
	return "HTML5"
}

func convertToDBModel(response URLAnalysisResponse) *models.URLAnalysis {
	analysis := &models.URLAnalysis{
		BaseURLAnalysisData: response.BaseURLAnalysisData,
		BrokenLinks:         response.BrokenLinkDetails,
	}

	for level, count := range response.HeadingCounts {
		analysis.HeadingCounts = append(analysis.HeadingCounts, models.HeadingCount{
			Level: level,
			Count: count,
		})
	}

	return analysis
}

func convertFromDBModel(analysis *models.URLAnalysis) URLAnalysisResponse {
	response := URLAnalysisResponse{
		BaseURLAnalysisData: analysis.BaseURLAnalysisData,
		HeadingCounts:       make(map[string]int),
		BrokenLinkDetails:   analysis.BrokenLinks,
	}

	for _, hc := range analysis.HeadingCounts {
		response.HeadingCounts[hc.Level] = hc.Count
	}

	return response
}
