import { isLoadingAtom, urlsAtom } from '@/store/urlStore'
import { useAtom } from 'jotai'

// Hook to get all URLs from Jotai store
export function useUrls() {
	const [urls] = useAtom(urlsAtom)
	const [isLoading] = useAtom(isLoadingAtom)

	return {
		data: urls,
		isLoading,
	}
}
