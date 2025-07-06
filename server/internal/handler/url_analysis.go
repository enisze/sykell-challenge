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
	URLs []string `json:"urls" binding:"required"`
}

type URLAnalysisResponse struct {
	types.BaseURLAnalysisData
	HeadingCounts map[string]int `json:"headingCounts"`
}

type URLAnalysisResults struct {
	Results []URLAnalysisResponse `json:"results"`
}

func AnalyzeURLs(c *gin.Context) {
	var req URLAnalysisRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	urlService := services.NewURLAnalysisService()
	var results []URLAnalysisResponse
	
	for _, urlStr := range req.URLs {
		existingAnalysis, err := urlService.GetAnalysisByURL(urlStr)
		if err == nil && existingAnalysis != nil {
			result := convertFromDBModel(existingAnalysis)
			results = append(results, result)
			continue
		}
		
		result := analyzeURL(urlStr)
		results = append(results, result)
		
		if result.Error == "" {
			dbAnalysis := convertToDBModel(result)
			urlService.SaveAnalysis(dbAnalysis)
		}
	}

	c.JSON(http.StatusOK, URLAnalysisResults{Results: results})
}

func analyzeURL(urlStr string) URLAnalysisResponse {
	result := URLAnalysisResponse{
		BaseURLAnalysisData: types.BaseURLAnalysisData{
			URL:         urlStr,
			HTMLVersion: "HTML5",
		},
		HeadingCounts: make(map[string]int),
	}

	client := &http.Client{Timeout: 10 * time.Second}
	
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

	analyzeHTML(doc, &result, baseHost)

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

func analyzeHTML(n *html.Node, result *URLAnalysisResponse, baseHost string) {
	if n.Type == html.ElementNode {
		switch strings.ToLower(n.Data) {
		case "title":
			if n.FirstChild != nil && n.FirstChild.Type == html.TextNode {
				result.PageTitle = strings.TrimSpace(n.FirstChild.Data)
			}
		case "h1", "h2", "h3", "h4", "h5", "h6":
			result.HeadingCounts[strings.ToUpper(n.Data)]++
		case "a":
			processLink(n, result, baseHost)
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
		analyzeHTML(c, result, baseHost)
	}
}

func processLink(n *html.Node, result *URLAnalysisResponse, baseHost string) {
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

			if linkURL.Host == "" || linkURL.Host == baseHost {
				result.InternalLinks++
			} else {
				result.ExternalLinks++
			}
			break
		}
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
		HeadingCounts: make(map[string]int),
	}

	for _, hc := range analysis.HeadingCounts {
		response.HeadingCounts[hc.Level] = hc.Count
	}

	return response
}
