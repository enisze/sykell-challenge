import { z } from 'zod'

const API_KEY = 'your-secret-api-key'
const API_ENDPOINT = 'http://localhost:8080/api/analyze-url'
const API_HEADERS = {
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY
} as const

// Schema for broken link details
const BrokenLinkSchema = z.object({
  url: z.string(),
  statusCode: z.number(),
  error: z.string().optional(),
})

export type BrokenLink = z.infer<typeof BrokenLinkSchema>

export const AnalysisResultSchema = z.object({
  pageTitle: z.string().optional(),
  htmlVersion: z.string().optional(),
  internalLinks: z.number().int().min(0).optional(),
  externalLinks: z.number().int().min(0).optional(),
  brokenLinks: z.number().int().min(0).optional(),
  hasLoginForm: z.boolean().optional(),
  headingCounts: z.record(z.string(), z.number().int().min(0)).optional(),
  brokenLinkDetails: z.array(BrokenLinkSchema).optional(),
  processingTime: z.number().min(0).optional(),
  error: z.string().optional(),
})

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>

export async function analyzeUrl(url: string, signal?: AbortSignal): Promise<AnalysisResult> {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: API_HEADERS,
    body: JSON.stringify({ url }),
    signal,
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  const result = await response.json()
  
  if (result.error) {
    throw new Error(result.error)
  }
  
  // Validate and parse the result using Zod schema
  try {
    const validatedResult = AnalysisResultSchema.parse(result)
    return validatedResult
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid API response format: ${error.message}`)
    }
    throw error
  }
}
