import type { URLEntry, URLStatus } from '@/types/url-analysis'
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'


export const urlsAtom = atomWithStorage<URLEntry[]>('urls', [])

export const isLoadingAtom = atom(false)

export const addUrlAtom = atom(
  null,
  (get, set, newUrl: URLEntry) => {
    const currentUrls = get(urlsAtom)
    set(urlsAtom, [newUrl, ...currentUrls])
  }
)

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

export const deleteUrlsAtom = atom(
  null,
  (get, set, urlIds: string[]) => {
    const currentUrls = get(urlsAtom)
    const filteredUrls = currentUrls.filter(url => !urlIds.includes(url.id))
    set(urlsAtom, filteredUrls)
  }
)


export const rerunUrlsWithQueueAtom = atom(
  null,
  (get, set, { urlIds, addToQueue }: { urlIds: string[], addToQueue: (urls: string[]) => void }) => {
    const currentUrls = get(urlsAtom)
    const urlsToRerun = currentUrls.filter(url => urlIds.includes(url.id))
    
    const updatedUrls = currentUrls.map(url => 
      urlIds.includes(url.id) 
        ? { ...url, status: "queued" as URLStatus, lastUpdated: new Date() }
        : url
    )
    set(urlsAtom, updatedUrls)
    
    const urlsToAdd = urlsToRerun.map(url => url.url)
    addToQueue(urlsToAdd)
  }
)

export const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9)
}
