import { addUrlAtom, generateId, updateUrlAtom } from '@/store/urlStore'
import type { URLEntry, URLStatus } from '@/types/url-analysis'
import { atom, useAtom } from 'jotai'
import { useCallback, useEffect, useRef } from 'react'

export const queueAtom = atom<string[]>([])
export const isProcessingAtom = atom(false)
export const currentProcessingUrlAtom = atom<string | null>(null)
export const queueStatusOpenAtom = atom(false)
export const currentBatchUrlsAtom = atom<string[]>([])
export const currentBatchCompletedAtom = atom<URLEntry[]>([])

export function useUrlQueue() {
  const [queue, setQueue] = useAtom(queueAtom)
  const [isProcessing, setIsProcessing] = useAtom(isProcessingAtom)
  const [currentProcessingUrl, setCurrentProcessingUrl] = useAtom(currentProcessingUrlAtom)
  const [, setQueueStatusOpen] = useAtom(queueStatusOpenAtom)
  const [currentBatchUrls, setCurrentBatchUrls] = useAtom(currentBatchUrlsAtom)
  const [currentBatchCompleted, setCurrentBatchCompleted] = useAtom(currentBatchCompletedAtom)
  const [, addUrl] = useAtom(addUrlAtom)
  const [, updateUrl] = useAtom(updateUrlAtom)
  
  const processingRef = useRef<boolean>(false)

  const addToQueue = useCallback((urlsToAdd: string[]) => {
    setQueue(prev => [...prev, ...urlsToAdd])
    setCurrentBatchUrls(urlsToAdd) // Track current batch URLs
    setCurrentBatchCompleted([]) // Reset completed for new batch
    setQueueStatusOpen(true) // Auto-open the queue status
  }, [setQueue, setCurrentBatchUrls, setCurrentBatchCompleted, setQueueStatusOpen])

  const removeFromQueue = useCallback((urlToRemove: string) => {
    setQueue(prev => prev.filter(url => url !== urlToRemove))
    setCurrentBatchUrls(prev => prev.filter(url => url !== urlToRemove))
  }, [setQueue, setCurrentBatchUrls])

  const clearQueue = useCallback(() => {
    setQueue([])
  }, [setQueue])

  const processUrl = useCallback(async (url: string) => {
    const id = generateId()
    
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
    
    addUrl(newUrlEntry)
    
    try {
      updateUrl({ ...newUrlEntry, status: "running" })
      
      const response = await fetch('http://localhost:8080/api/analyze-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'your-secret-api-key',
        },
        body: JSON.stringify({ urls: [url] }),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      const analysisResult = result.results?.[0]
      
      if (!analysisResult) {
        throw new Error("No analysis result returned")
      }
      
      const completedEntry: URLEntry = {
        ...newUrlEntry,
        title: analysisResult.pageTitle || "Analysis Complete",
        htmlVersion: analysisResult.htmlVersion || "HTML5",
        internalLinks: analysisResult.internalLinks || 0,
        externalLinks: analysisResult.externalLinks || 0,
        brokenLinks: 0,
        status: analysisResult.error ? "error" : "done" as URLStatus,
        lastUpdated: new Date(),
        processingTime: 0,
        errorMessage: analysisResult.error,
      }
      
      updateUrl(completedEntry)
      
      if (currentBatchUrls.includes(url)) {
        setCurrentBatchCompleted(prev => [...prev, completedEntry])
      }
      
    } catch (error) {
      const errorEntry: URLEntry = {
        ...newUrlEntry,
        status: "error" as URLStatus,
        lastUpdated: new Date(),
        errorMessage: error instanceof Error ? error.message : "Unknown error occurred",
      }
      
      updateUrl(errorEntry)
      
      if (currentBatchUrls.includes(url)) {
        setCurrentBatchCompleted(prev => [...prev, errorEntry])
      }
    }
  }, [addUrl, updateUrl, currentBatchUrls, setCurrentBatchCompleted])

  const processQueue = useCallback(async () => {
    if (processingRef.current || queue.length === 0) {
      return
    }

    processingRef.current = true
    setIsProcessing(true)

    try {
      for (const url of queue) {
        setCurrentProcessingUrl(url)
        await processUrl(url)
        
        setQueue(prev => prev.filter(u => u !== url))
        
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    } finally {
      processingRef.current = false
      setIsProcessing(false)
      setCurrentProcessingUrl(null)
    }
  }, [queue, processUrl, setIsProcessing, setCurrentProcessingUrl, setQueue])

  useEffect(() => {
    if (queue.length > 0 && !isProcessing && !processingRef.current) {
      processQueue()
    }
  }, [queue, isProcessing, processQueue])

  const queueStatus = {
    pending: queue.length,
    currentUrl: currentProcessingUrl,
    isProcessing,
    totalCompleted: currentBatchCompleted.length,
    recentlyCompleted: currentBatchCompleted
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, 10) // Show last 10 completed from current batch
  }

  return {
    queue,
    queueStatus,
    addToQueue,
    removeFromQueue,
    clearQueue,
    processQueue,
  }
}
