import type { URLEntry } from '@/types/url-analysis'
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'


// URL storage atom with local storage persistence
export const urlsAtom = atomWithStorage<URLEntry[]>('urls', [])

// Loading state atom
export const isLoadingAtom = atom(false)

// Add URL to store
export const addUrlAtom = atom(
  null,
  (get, set, newUrl: URLEntry) => {
    const currentUrls = get(urlsAtom)
    set(urlsAtom, [newUrl, ...currentUrls])
  }
)

// Update URL in store
export const updateUrlAtom = atom(
  null,
  (get, set, updatedUrl: URLEntry) => {
    const currentUrls = get(urlsAtom)
    const updatedUrls = currentUrls.map(url => 
      url.id === updatedUrl.id ? updatedUrl : url
    )
    set(urlsAtom, updatedUrls)
  }
)

// Generate unique ID
export const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9)
}
