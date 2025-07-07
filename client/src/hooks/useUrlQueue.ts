import { analyzeUrl } from '@/lib/api'
import { processUrlAtom } from '@/store/urlStore'
import type { URLEntry } from '@/types/url-analysis'
import { atom, useAtom, useSetAtom } from 'jotai'
import { useCallback, useEffect, useMemo, useRef } from 'react'

export const queueAtom = atom<string[]>([])
export const isProcessingAtom = atom(false)
export const currentProcessingUrlAtom = atom<string | null>(null)
export const currentBatchUrlsAtom = atom<string[]>([])
export const currentBatchCompletedAtom = atom<URLEntry[]>([])

export const queueProgressAtom = atom((get) => {
  const currentBatchUrls = get(currentBatchUrlsAtom)
  const currentBatchCompleted = get(currentBatchCompletedAtom)
  
  return currentBatchUrls.length > 0 ? (currentBatchCompleted.length / currentBatchUrls.length) * 100 : 0
})

// Constants
const PROCESSING_DELAY = 1000 // Increased to 1 second for better rate limiting

/**
 * URL queue management hook with batch processing
 * 
 * @returns Queue management functions and status
 */
export function useUrlQueue() {
  const [queue, setQueue] = useAtom(queueAtom)
  const [isProcessing, setIsProcessing] = useAtom(isProcessingAtom)
  const [currentProcessingUrl, setCurrentProcessingUrl] = useAtom(currentProcessingUrlAtom)
  const [currentBatchUrls, setCurrentBatchUrls] = useAtom(currentBatchUrlsAtom)
  const [currentBatchCompleted, setCurrentBatchCompleted] = useAtom(currentBatchCompletedAtom)
  const processUrl = useSetAtom(processUrlAtom)
  const queueProgress = useAtom(queueProgressAtom)[0]
  
  const abortControllerRef = useRef<AbortController | null>(null)

  const updateBatchCompleted = useCallback((url: string, entry: URLEntry) => {
    if (!currentBatchUrls.includes(url)) return
    
    setCurrentBatchCompleted(prev => {
      const existingIndex = prev.findIndex(e => e.url === url)
      if (existingIndex >= 0) {
        const newArray = [...prev]
        newArray[existingIndex] = entry
        return newArray
      }
      return [...prev, entry]
    })
  }, [currentBatchUrls, setCurrentBatchCompleted])

  const addToQueue = useCallback((urlsToAdd: string[]) => {
    const uniqueUrls = [...new Set(urlsToAdd)]
    
    setQueue(prev => {
      const existingUrls = new Set(prev)
      const newUrls = uniqueUrls.filter(url => !existingUrls.has(url))
      return newUrls.length > 0 ? [...prev, ...newUrls] : prev
    })
    
    setCurrentBatchUrls(uniqueUrls)
    setCurrentBatchCompleted([])
  }, [setQueue, setCurrentBatchUrls, setCurrentBatchCompleted])

  const analyzeUrlWithProcessing = useCallback(async (url: string) => {
    const controller = new AbortController()
    abortControllerRef.current = controller
    
    try {
      // Step 1: Create URL entry with "queued" status
      processUrl({ url, status: "queued" })
      
      // Step 2: Update to "running" status
      processUrl({ url })
      
      // Step 3: Make API request
      const result = await analyzeUrl(url, controller.signal)
      
      // Step 4: Update to "done" status with results
      const completedEntry = processUrl({ url, apiResult: result })
      updateBatchCompleted(url, completedEntry)
      
    } catch (error) {
      // Handle cancellation gracefully
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      
      // Step 5: Update to "error" status
      const errorEntry = processUrl({ 
        url, 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      })
      updateBatchCompleted(url, errorEntry)
    } finally {
      // Clean up abort controller
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
      }
    }
  }, [processUrl, updateBatchCompleted])

  const processQueueItems = useCallback(async () => {
    // Use isProcessing state instead of ref to prevent race conditions
    if (isProcessing || queue.length === 0) return

    setIsProcessing(true)

    try {
      const urlsToProcess = [...queue]
      
      for (const url of urlsToProcess) {
        if (!isProcessing) break
        
        setCurrentProcessingUrl(url)
        await analyzeUrlWithProcessing(url)
        setQueue(prev => prev.filter(u => u !== url))
        
        if (urlsToProcess.indexOf(url) < urlsToProcess.length - 1) {
          await new Promise(resolve => setTimeout(resolve, PROCESSING_DELAY))
        }
      }
    } finally {
      setIsProcessing(false)
      setCurrentProcessingUrl(null)
    }
  }, [queue, isProcessing, analyzeUrlWithProcessing, setIsProcessing, setCurrentProcessingUrl, setQueue])

  const cancelProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsProcessing(false)
    setCurrentProcessingUrl(null)
    setQueue([])
    setCurrentBatchUrls([])
    setCurrentBatchCompleted([])
  }, [setIsProcessing, setCurrentProcessingUrl, setQueue, setCurrentBatchUrls, setCurrentBatchCompleted])

  const startProcessing = useCallback(() => {
    if (queue.length > 0 && !isProcessing) {
      processQueueItems()
    }
  }, [queue.length, isProcessing, processQueueItems])

  // Auto-start processing when queue has items (but only if not already processing)
  useEffect(() => {
    startProcessing()
  }, [startProcessing])

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const queueStatus = useMemo(() => ({
    pending: queue.length,
    currentUrl: currentProcessingUrl,
    isProcessing,
    totalCompleted: currentBatchCompleted.length,
    recentlyCompleted: currentBatchCompleted
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, 10),
    progress: queueProgress,
  }), [queue.length, currentProcessingUrl, isProcessing, currentBatchCompleted, queueProgress])

  return {
    queue,
    queueStatus,
    addToQueue,
    processQueue: processQueueItems,
    cancelProcessing,
    startProcessing,
  }
}
