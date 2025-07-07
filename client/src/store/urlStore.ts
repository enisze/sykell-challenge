import type { URLEntry } from '@/types/url-analysis'
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

// Mock data for initial state
const initialMockData: URLEntry[] = [
  {
    id: "1",
    url: "https://example.com",
    title: "Example Domain",
    htmlVersion: "HTML5",
    internalLinks: 15,
    externalLinks: 8,
    brokenLinks: 2,
    status: "done",
    lastUpdated: new Date("2024-01-15T10:30:00"),
    processingTime: 2.5,
  },
  {
    id: "2",
    url: "https://github.com",
    title: "GitHub: Let's build from here",
    htmlVersion: "HTML5",
    internalLinks: 45,
    externalLinks: 12,
    brokenLinks: 0,
    status: "running",
    lastUpdated: new Date("2024-01-15T11:15:00"),
    crawlProgress: 65,
  },
  {
    id: "3",
    url: "https://stackoverflow.com",
    title: "Stack Overflow - Where Developers Learn",
    htmlVersion: "HTML5",
    internalLinks: 32,
    externalLinks: 18,
    brokenLinks: 1,
    status: "done",
    lastUpdated: new Date("2024-01-15T09:45:00"),
    processingTime: 4.2,
  },
  {
    id: "4",
    url: "https://invalid-url-example.com",
    title: "Failed Analysis",
    htmlVersion: "Unknown",
    internalLinks: 0,
    externalLinks: 0,
    brokenLinks: 0,
    status: "error",
    lastUpdated: new Date("2024-01-15T08:20:00"),
    errorMessage: "Connection timeout",
  },
  {
    id: "5",
    url: "https://reddit.com",
    title: "Reddit - Dive into anything",
    htmlVersion: "HTML5",
    internalLinks: 28,
    externalLinks: 6,
    brokenLinks: 3,
    status: "queued",
    lastUpdated: new Date("2024-01-15T12:00:00"),
  },
  {
    id: "6",
    url: "https://twitter.com",
    title: "Twitter",
    htmlVersion: "HTML5",
    internalLinks: 22,
    externalLinks: 4,
    brokenLinks: 0,
    status: "done",
    lastUpdated: new Date("2024-01-14T14:20:00"),
    processingTime: 1.8,
  },
  {
    id: "7",
    url: "https://linkedin.com",
    title: "LinkedIn",
    htmlVersion: "HTML5",
    internalLinks: 35,
    externalLinks: 7,
    brokenLinks: 1,
    status: "stopped",
    lastUpdated: new Date("2024-01-13T16:45:00"),
  },
]

// URL storage atom with local storage persistence
export const urlsAtom = atomWithStorage<URLEntry[]>('urls', initialMockData)

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
