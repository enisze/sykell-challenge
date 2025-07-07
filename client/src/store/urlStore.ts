import type { URLEntry, URLStatus } from '@/types/url-analysis'
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'


export const urlsAtom = atomWithStorage<URLEntry[]>('urls', [])

export const isLoadingAtom = atom(false)


export const addOrUpdateUrlAtom = atom(
  null,
  (get, set, input: string | URLEntry): URLEntry => {
    const currentUrls = get(urlsAtom)
    
    if (typeof input === 'string') {
      const existingUrl = currentUrls.find(url => url.url === input)
      
      if (existingUrl) {
        const updatedUrl = {
          ...existingUrl,
          status: "queued" as URLStatus,
          lastUpdated: new Date(),
        }
        const updatedUrls = currentUrls.map(url => 
          url.id === existingUrl.id ? updatedUrl : url
        )
        set(urlsAtom, updatedUrls)
        return updatedUrl
      } else {
        const id = generateId()
        const newUrl: URLEntry = {
          id,
          url: input,
          title: "Analyzing...",
          htmlVersion: "Unknown",
          internalLinks: 0,
          externalLinks: 0,
          brokenLinks: 0,
          hasLoginForm: false,
          headingCounts: {},
          brokenLinkDetails: [],
          status: "queued" as URLStatus,
          lastUpdated: new Date(),
        }
        set(urlsAtom, [newUrl, ...currentUrls])
        return newUrl
      }
    } else {
      const existingUrl = currentUrls.find(url => url.url === input.url)
      
      if (existingUrl) {
        // Update existing URL entry
        const updatedUrl = { ...input, id: existingUrl.id }
        const updatedUrls = currentUrls.map(url => 
          url.id === existingUrl.id ? updatedUrl : url
        )
        set(urlsAtom, updatedUrls)
        return updatedUrl
      } else {
        // Add new URL entry
        set(urlsAtom, [input, ...currentUrls])
        return input
      }
    }
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
