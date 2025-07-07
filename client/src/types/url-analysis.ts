export type URLStatus = "queued" | "running" | "done" | "error" | "stopped"

export interface URLEntry {
  id: string
  url: string
  title: string
  htmlVersion: string
  internalLinks: number
  externalLinks: number
  brokenLinks: number
  status: URLStatus
  lastUpdated: Date | string
  processingTime?: number
  crawlProgress?: number
  errorMessage?: string
}
