import { addUrlAtom, generateId, isLoadingAtom, updateUrlAtom, urlsAtom } from '@/store/urlStore'
import type { URLEntry, URLStatus } from '@/types/url-analysis'
import { useAtom } from 'jotai'

// Hook to get all URLs from Jotai store
export function useUrls() {
  const [urls] = useAtom(urlsAtom)
  const [isLoading] = useAtom(isLoadingAtom)
  
  return {
    data: urls,
    isLoading,
    error: null // No error handling for now with Jotai
  }
}

// Hook to add a new URL
export function useAddUrl() {
  const [, addUrl] = useAtom(addUrlAtom)
  const [, updateUrl] = useAtom(updateUrlAtom)
  const [, setIsLoading] = useAtom(isLoadingAtom)

  const startCrawl = async (url: string) => {
    const id = generateId()
    
    // Create initial URL entry with "queued" status
    const newUrlEntry: URLEntry = {
      id,
      url,
      title: "Analyzing...",
      htmlVersion: "Unknown",
      internalLinks: 0,
      externalLinks: 0,
      brokenLinks: 0,
      status: "queued",
      lastUpdated: new Date(),
    }
    
    // Add to store immediately
    addUrl(newUrlEntry)
    setIsLoading(true)
    
    try {
      // Update status to running
      updateUrl({ ...newUrlEntry, status: "running" })
      
      // Call the API
      const response = await fetch('http://localhost:8080/api/analyze-urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'your-secret-api-key', // Matches the API key in server's .env.example
        },
        body: JSON.stringify({ urls: [url] }), // API expects an array of URLs
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      // API returns { results: [URLAnalysisResponse] }
      const analysisResult = result.results?.[0]
      
      if (!analysisResult) {
        throw new Error("No analysis result returned")
      }
      
      // Update with successful result
      const completedEntry: URLEntry = {
        ...newUrlEntry,
        title: analysisResult.pageTitle || "Analysis Complete",
        htmlVersion: analysisResult.htmlVersion || "HTML5",
        internalLinks: analysisResult.internalLinks || 0,
        externalLinks: analysisResult.externalLinks || 0,
        brokenLinks: 0, // This field doesn't seem to be in the server response yet
        status: analysisResult.error ? "error" : "done" as URLStatus,
        lastUpdated: new Date(),
        processingTime: 0, // Server doesn't return this yet
        errorMessage: analysisResult.error,
      }
      
      updateUrl(completedEntry)
      
    } catch (error) {
      // Update with error status
      const errorEntry: URLEntry = {
        ...newUrlEntry,
        status: "error" as URLStatus,
        lastUpdated: new Date(),
        errorMessage: error instanceof Error ? error.message : "Unknown error occurred",
      }
      
      updateUrl(errorEntry)
    } finally {
      setIsLoading(false)
    }
  }

  return { startCrawl }
}
