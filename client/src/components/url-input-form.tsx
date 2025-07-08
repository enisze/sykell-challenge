import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useUrlQueue } from '@/hooks/useUrlQueue'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function URLInputForm() {
	const [urlInput, setUrlInput] = useState('')
	const { addToQueue, queueStatus, startProcessing } = useUrlQueue()

	// Extract URLs from text input (supports multiple formats)
	const parseUrls = (input: string): string[] => {
		const urlRegex = /https?:\/\/[^\s,\n]+/g
		const matches = input.match(urlRegex) || []
		return [...new Set(matches)]
	}

	const analyzeUrls = () => {
		const urls = parseUrls(urlInput)
		if (urls.length === 0) {
			toast.error('No valid URLs found')
			return
		}

		addToQueue(urls)
		setUrlInput('')
		toast.success(`Added ${urls.length} URL(s) to analysis queue`)

		startProcessing()
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Plus className="h-5 w-5" />
					Analyze URLs
				</CardTitle>
				<CardDescription>
					Enter URLs to analyze. All URLs will be processed sequentially in a
					queue.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="url-input">URLs to analyze</Label>
					<textarea
						id="url-input"
						placeholder="https://example.com&#10;https://another-site.com&#10;https://third-site.com"
						value={urlInput}
						onChange={(e) => setUrlInput(e.target.value)}
						className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						disabled={queueStatus.isProcessing}
					/>
				</div>

				<Button
					onClick={analyzeUrls}
					disabled={!urlInput.trim()}
					className="w-full"
				>
					<Plus className="mr-2 h-4 w-4" />
					Analyze URLs
				</Button>

				{queueStatus.pending > 0 && (
					<div className="text-sm text-muted-foreground text-center">
						{queueStatus.pending} URL(s) in queue
					</div>
				)}
			</CardContent>
		</Card>
	)
}
