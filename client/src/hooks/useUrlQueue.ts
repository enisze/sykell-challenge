import { analyzeUrl } from '@/lib/api'
import {
	cleanupQueuedUrlsAtom,
	isCancelledAtom,
	processUrlAtom,
} from '@/store/urlStore'
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

	return currentBatchUrls.length > 0
		? (currentBatchCompleted.length / currentBatchUrls.length) * 100
		: 0
})

const PROCESSING_DELAY = 1000
const CANCELLATION_CHECK_INTERVAL = 50

/**
 * URL queue management hook with batch processing
 */
export function useUrlQueue() {
	const [queue, setQueue] = useAtom(queueAtom)
	const [isProcessing, setIsProcessing] = useAtom(isProcessingAtom)
	const [currentProcessingUrl, setCurrentProcessingUrl] = useAtom(
		currentProcessingUrlAtom,
	)
	const [currentBatchUrls, setCurrentBatchUrls] = useAtom(currentBatchUrlsAtom)
	const [currentBatchCompleted, setCurrentBatchCompleted] = useAtom(
		currentBatchCompletedAtom,
	)
	const [isCancelled, setIsCancelled] = useAtom(isCancelledAtom)
	const queueProgress = useAtom(queueProgressAtom)[0]

	const processUrl = useSetAtom(processUrlAtom)
	const cleanupQueuedUrls = useSetAtom(cleanupQueuedUrlsAtom)

	const isCancelledRef = useRef(false)
	const isProcessingRef = useRef(false)
	const processingUrlsRef = useRef<Set<string>>(new Set())

	const shouldCancel = useCallback(() => {
		return isCancelledRef.current || isCancelled
	}, [isCancelled])

	const updateBatchCompleted = useCallback(
		(url: string, entry: URLEntry) => {
			if (shouldCancel() || !currentBatchUrls.includes(url)) return

			setCurrentBatchCompleted((prev) => {
				const existingIndex = prev.findIndex((e) => e.url === url)
				if (existingIndex >= 0) {
					const updated = [...prev]
					updated[existingIndex] = entry
					return updated
				}
				return [...prev, entry]
			})
		},
		[currentBatchUrls, setCurrentBatchCompleted, shouldCancel],
	)

	const addToQueue = useCallback(
		(urlsToAdd: string[]) => {
			const uniqueUrls = [...new Set(urlsToAdd)]

			setQueue((prev) => {
				const existingUrls = new Set(prev)
				const newUrls = uniqueUrls.filter((url) => !existingUrls.has(url))
				return newUrls.length > 0 ? [...prev, ...newUrls] : prev
			})

			setCurrentBatchUrls(uniqueUrls)
			setCurrentBatchCompleted([])

			isCancelledRef.current = false
			setIsCancelled(false)
			
			processingUrlsRef.current.clear()
		},
		[setQueue, setCurrentBatchUrls, setCurrentBatchCompleted, setIsCancelled],
	)

	const analyzeUrlWithProcessing = useCallback(
		async (url: string) => {
			if (shouldCancel() || processingUrlsRef.current.has(url)) {
				return
			}

			processingUrlsRef.current.add(url)

			try {
				// Step 1: Queue status
				const result = processUrl({ url, status: 'queued' })
				if (!result) {
					// processUrl returned null, meaning we're cancelled
					return
				}

				// Step 2: Running status
				const runningResult = processUrl({ url })
				if (!runningResult) {
					// processUrl returned null, meaning we're cancelled
					return
				}

				// Step 3: API call with cancellation race
				const apiResult = await analyzeUrl(url)

				const entry = processUrl({
					url,
					apiResult,
				})
				if (entry) {
					updateBatchCompleted(url, entry)
				}
			} catch (error) {
				if (error instanceof Error && error.name === 'AbortError') {
					return // Cancellation is expected
				}

				if (!shouldCancel()) {
					const entry = processUrl({
						url,
						error: error instanceof Error ? error.message : 'Unknown error',
					})
					if (entry) {
						updateBatchCompleted(url, entry)
					}
				}
			} finally {
				processingUrlsRef.current.delete(url)
			}
		},
		[processUrl, updateBatchCompleted, shouldCancel],
	)

	const processQueueItems = useCallback(async () => {
		if (isProcessingRef.current) {
			return
		}

		isProcessingRef.current = true
		setIsProcessing(true)

		try {
			// Get current queue state inside the function
			let currentQueue: string[] = []
			setQueue((prev) => {
				currentQueue = [...prev]
				return prev
			})

			if (currentQueue.length === 0) {
				return
			}

			for (let i = 0; i < currentQueue.length; i++) {
				if (shouldCancel()) break

				const url = currentQueue[i]
				setCurrentProcessingUrl(url)

				await analyzeUrlWithProcessing(url)

				setQueue((prev) => prev.filter((u) => u !== url))

				// Add delay between requests with cancellation checks
				if (i < currentQueue.length - 1) {
					for (
						let elapsed = 0;
						elapsed < PROCESSING_DELAY;
						elapsed += CANCELLATION_CHECK_INTERVAL
					) {
						await new Promise((resolve) =>
							setTimeout(resolve, CANCELLATION_CHECK_INTERVAL),
						)
					}
				}
			}
		} catch (error) {
			console.error('Queue processing error:', error)
		} finally {
			isProcessingRef.current = false
			setIsProcessing(false)
			setCurrentProcessingUrl(null)
		}
	}, [
		shouldCancel,
		analyzeUrlWithProcessing,
		setIsProcessing,
		setCurrentProcessingUrl,
		setQueue,
		setIsCancelled,
	])

	const cancelProcessing = useCallback(() => {
		isCancelledRef.current = true
		setIsCancelled(true)

		processingUrlsRef.current.clear()
		isProcessingRef.current = false
		
		cleanupQueuedUrls(currentBatchUrls)

		setIsProcessing(false)
		setCurrentProcessingUrl(null)
		setQueue([])
		setCurrentBatchUrls([])
		setCurrentBatchCompleted([])

		return Promise.resolve()
	}, [
		setIsCancelled,
		setIsProcessing,
		setCurrentProcessingUrl,
		setQueue,
		setCurrentBatchUrls,
		setCurrentBatchCompleted,
		cleanupQueuedUrls,
		currentBatchUrls,
	])

	const startProcessing = useCallback(() => {
		// Reset cancellation state
		isCancelledRef.current = false
		setIsCancelled(false)

		processingUrlsRef.current.clear()

		processQueueItems()

		// setTimeout(() => {
		// 	if (!isProcessingRef.current) {
		// 		processQueueItems()
		// 	}
		// }, 50)
	}, [processQueueItems, setIsCancelled])

	useEffect(() => {
		return () => {
			isCancelledRef.current = true
			processingUrlsRef.current.clear()
			isProcessingRef.current = false
		}
	}, [])

	const queueStatus = useMemo(
		() => ({
			pending: queue.length,
			currentUrl: currentProcessingUrl,
			isProcessing,
			totalCompleted: currentBatchCompleted.length,
			recentlyCompleted: isCancelled
				? []
				: currentBatchCompleted
						.sort(
							(a, b) =>
								new Date(b.lastUpdated).getTime() -
								new Date(a.lastUpdated).getTime(),
						)
						.slice(0, 10),
			progress: queueProgress,
		}),
		[
			queue.length,
			currentProcessingUrl,
			isProcessing,
			currentBatchCompleted,
			queueProgress,
			isCancelled,
		],
	)

	return {
		queue,
		queueStatus,
		addToQueue,
		processQueue: processQueueItems,
		cancelProcessing,
		startProcessing,
	}
}
