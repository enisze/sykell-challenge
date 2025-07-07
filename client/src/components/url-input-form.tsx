import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAddUrl } from "@/hooks/useUrls"
import { Loader2, Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function URLInputForm() {
  const [url, setUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { startCrawl } = useAddUrl()

  const validateUrl = (input: string): boolean => {
    try {
      new URL(input)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!url.trim()) {
      toast.error("Please enter a URL")
      return
    }

    if (!validateUrl(url)) {
      toast.error("Please enter a valid URL")
      return
    }

    setIsSubmitting(true)
    
    try {
      await startCrawl(url)
      toast.success("URL analysis started!")
      setUrl("")
    } catch (error) {
      toast.error("Failed to start URL analysis")
      console.error("Error starting crawl:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Analyze New URL
        </CardTitle>
        <CardDescription>
          Enter a URL to start analyzing its structure, links, and performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="url-input" className="sr-only">
              URL to analyze
            </Label>
            <Input
              id="url-input"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isSubmitting}
              className="flex-1"
            />
          </div>
          <Button type="submit" disabled={isSubmitting || !url.trim()}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Analyze
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
