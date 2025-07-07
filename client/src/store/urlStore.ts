import type { AnalysisResult } from '@/lib/api'
import type { URLEntry, URLStatus } from '@/types/url-analysis'
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'


export const urlsAtom = atomWithStorage<URLEntry[]>('urls', [])

export const isLoadingAtom = atom(false)

// Enhanced atom for processing URLs with all status updates
export const processUrlAtom = atom(
  null,
  (get, set, { url, apiResult, error, status }: { 
    url: string, 
    apiResult?: AnalysisResult, 
    error?: string,
    status?: URLStatus 
  }): URLEntry => {
    const currentUrls = get(urlsAtom)
    const existingUrl = currentUrls.find(u => u.url === url)
    
    let updatedUrl: URLEntry
    
    if (apiResult) {
      // Success case
      updatedUrl = {
        id: existingUrl?.id || generateId(),
        url,
        title: apiResult.pageTitle || "Analysis Complete",
        htmlVersion: apiResult.htmlVersion || "HTML5",
        internalLinks: apiResult.internalLinks || 0,
        externalLinks: apiResult.externalLinks || 0,
        brokenLinks: apiResult.brokenLinks || 0,
        hasLoginForm: apiResult.hasLoginForm || false,
        headingCounts: apiResult.headingCounts || {},
        brokenLinkDetails: apiResult.brokenLinkDetails || [],
        status: "done" as URLStatus,
        lastUpdated: new Date(),
        processingTime: apiResult.processingTime || 0,
      }
    } else if (error) {
      // Error case
      updatedUrl = {
        id: existingUrl?.id || generateId(),
        url,
        title: existingUrl?.title || "Analysis Failed",
        htmlVersion: existingUrl?.htmlVersion || "Unknown",
        internalLinks: existingUrl?.internalLinks || 0,
        externalLinks: existingUrl?.externalLinks || 0,
        brokenLinks: existingUrl?.brokenLinks || 0,
        hasLoginForm: existingUrl?.hasLoginForm || false,
        headingCounts: existingUrl?.headingCounts || {},
        brokenLinkDetails: existingUrl?.brokenLinkDetails || [],
        status: "error" as URLStatus,
        lastUpdated: new Date(),
        errorMessage: error,
      }
    } else if (status === "queued") {
      // Initial queued state - create new entry or update existing to queued
      updatedUrl = {
        id: existingUrl?.id || generateId(),
        url,
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
    } else {
      // Running case (default when no specific status provided)
      updatedUrl = {
        id: existingUrl?.id || generateId(),
        url,
        title: existingUrl?.title || "Analyzing...",
        htmlVersion: existingUrl?.htmlVersion || "Unknown",
        internalLinks: existingUrl?.internalLinks || 0,
        externalLinks: existingUrl?.externalLinks || 0,
        brokenLinks: existingUrl?.brokenLinks || 0,
        hasLoginForm: existingUrl?.hasLoginForm || false,
        headingCounts: existingUrl?.headingCounts || {},
        brokenLinkDetails: existingUrl?.brokenLinkDetails || [],
        status: "running" as URLStatus,
        lastUpdated: new Date(),
      }
    }
    
    const updatedUrls = existingUrl
      ? currentUrls.map(u => u.id === existingUrl.id ? updatedUrl : u)
      : [updatedUrl, ...currentUrls]
    
    set(urlsAtom, updatedUrls)
    return updatedUrl
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
    
    // Use processUrl to update each URL to queued status
    for (const url of urlsToRerun) {
      set(processUrlAtom, { url: url.url, status: "queued" as URLStatus })
    }
    
    const urlsToAdd = urlsToRerun.map(url => url.url)
    addToQueue(urlsToAdd)
  }
)

export const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9)
}
