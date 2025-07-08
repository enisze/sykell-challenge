import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useUrlQueue } from '@/hooks/useUrlQueue'
import { URLStatus } from '@/types/url-analysis'
import {
	AlertCircle,
	CheckCircle,
	Clock,
	List,
	Loader2,
	Minimize2,
	Play,
	StopCircle,
	X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const getStatusDisplay = (status: URLStatus) => {
	switch (status) {
		case 'queued':
			return { icon: Clock, color: 'text-yellow-500', label: 'Queued' }
		case 'running':
			return { icon: Loader2, color: 'text-blue-500', label: 'Running' }
		case 'done':
			return { icon: CheckCircle, color: 'text-green-500', label: 'Done' }
		case 'error':
			return { icon: AlertCircle, color: 'text-red-500', label: 'Error' }
		default:
			return { icon: Clock, color: 'text-gray-500', label: 'Unknown' }
	}
}

export function QueueStatusComponent() {
	const { queue, queueStatus, cancelProcessing, startProcessing } = useUrlQueue()
	const [isCollapsed, setIsCollapsed] = useState(false)
	const [isQueueStatusOpen, setIsQueueStatusOpen] = useState(true)

	useEffect(() => {
		if (queueStatus.isProcessing && !isQueueStatusOpen) {
			setIsQueueStatusOpen(true)
		}
	}, [queueStatus.isProcessing, isQueueStatusOpen])

	const handleCancelProcessing = () => {
		cancelProcessing()
		toast.info('Processing cancelled', {
			description: 'All pending URL analyses have been stopped and cleared.',
		})
	}

	const handleRestartProcessing = () => {
		if (queue.length > 0) {
			startProcessing()
			toast.info('Processing restarted', {
				description: 'Queue processing has been restarted.',
			})
		}
	}

	const shouldShow =
		queue.length > 0 ||
		queueStatus.isProcessing ||
		queueStatus.recentlyCompleted.length > 0

	// Don't show the component if there's nothing to display or if user closed it
	if (!shouldShow || !isQueueStatusOpen) {
		return null
	}

	if (isCollapsed) {
		return (
			<Card className="fixed bottom-4 right-4 z-50 w-80 shadow-lg">
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<CardTitle className="text-sm flex items-center gap-2">
							{queueStatus.isProcessing ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<List className="h-4 w-4" />
							)}
							Queue Status
						</CardTitle>
						<div className="flex items-center gap-1">
							{queueStatus.isProcessing && (
								<Button
									size="sm"
									variant="ghost"
									onClick={handleCancelProcessing}
									className="h-6 w-6 p-0"
									title="Cancel Processing"
								>
									<StopCircle className="h-3 w-3" />
								</Button>
							)}
							<Button
								size="sm"
								variant="ghost"
								onClick={() => setIsCollapsed(false)}
								className="h-6 w-6 p-0"
								title="Expand"
							>
								<Minimize2 className="h-3 w-3" />
							</Button>
							<Button
								size="sm"
								variant="ghost"
								onClick={() => setIsQueueStatusOpen(false)}
								className="h-6 w-6 p-0"
								title="Close"
							>
								<X className="h-3 w-3" />
							</Button>
						</div>
					</div>
					<CardDescription className="text-xs">
						{queueStatus.isProcessing && queueStatus.currentUrl && (
							<div className="flex items-center gap-1">
								<Loader2 className="h-3 w-3 animate-spin" />
								<span className="truncate">
									Processing: {queueStatus.currentUrl}
								</span>
							</div>
						)}
						{!queueStatus.isProcessing && queue.length > 0 && (
							<span>{queue.length} URLs in queue</span>
						)}
						{!queueStatus.isProcessing &&
							queue.length === 0 &&
							queueStatus.totalCompleted > 0 && (
								<span>{queueStatus.totalCompleted} completed</span>
							)}
					</CardDescription>
				</CardHeader>
			</Card>
		)
	}

	return (
		<Card className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-hidden shadow-lg">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm flex items-center gap-2">
						{queueStatus.isProcessing ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<List className="h-4 w-4" />
						)}
						URL Analysis Queue
					</CardTitle>
					<div className="flex items-center gap-1">
						<Button
							size="sm"
							variant="ghost"
							onClick={() => setIsCollapsed(true)}
							className="h-6 w-6 p-0"
							title="Minimize"
						>
							<Minimize2 className="h-3 w-3" />
						</Button>
						<Button
							size="sm"
							variant="ghost"
							onClick={() => setIsQueueStatusOpen(false)}
							className="h-6 w-6 p-0"
							title="Close"
						>
							<X className="h-3 w-3" />
						</Button>
					</div>
				</div>
				<CardDescription className="text-xs">
					{queueStatus.pending} pending • {queueStatus.totalCompleted} completed
				</CardDescription>
			</CardHeader>

			<CardContent className="space-y-4 overflow-y-auto max-h-80">
				{queueStatus.isProcessing && queueStatus.currentUrl && (
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Loader2 className="h-4 w-4 animate-spin text-blue-500" />
								<span className="text-sm font-medium">
									Currently Processing
								</span>
							</div>
							<Button
								size="sm"
								variant="outline"
								onClick={handleCancelProcessing}
								className="h-6 text-xs px-2"
							>
								<StopCircle className="h-3 w-3 mr-1" />
								Cancel
							</Button>
						</div>
						<div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
							<div className="flex items-center justify-between mb-2">
								<span className="text-sm truncate flex-1">
									{queueStatus.currentUrl}
								</span>
								<Badge variant="outline" className="text-blue-500">
									Running
								</Badge>
							</div>
							<Progress value={50} className="h-2" />
						</div>
					</div>
				)}

				{queue.length > 0 && (
					<>
						{queueStatus.isProcessing && <Separator />}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Clock className="h-4 w-4 text-yellow-500" />
									<span className="text-sm font-medium">
										Queue ({queue.length})
									</span>
								</div>
								{!queueStatus.isProcessing && (
									<Button
										size="sm"
										variant="outline"
										onClick={handleRestartProcessing}
										className="h-6 text-xs px-2"
									>
										<Play className="h-3 w-3 mr-1" />
										Start
									</Button>
								)}
							</div>
							<div className="space-y-2 max-h-32 overflow-y-auto">
								{queue.map((url, index) => (
									<div
										key={index}
										className="flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/20 rounded p-2"
									>
										<span className="text-sm truncate flex-1">{url}</span>
										<Badge variant="outline" className="text-yellow-500">
											#{index + 1}
										</Badge>
									</div>
								))}
							</div>
						</div>
					</>
				)}

				{queueStatus.recentlyCompleted.length > 0 && (
					<>
						<Separator />
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<CheckCircle className="h-4 w-4 text-green-500" />
								<span className="text-sm font-medium">Completed</span>
							</div>
							<div className="space-y-2 max-h-32 overflow-y-auto">
								{queueStatus.recentlyCompleted.map((urlEntry) => {
									const {
										icon: StatusIcon,
										color,
										label,
									} = getStatusDisplay(urlEntry.status)
									const isSuccess = urlEntry.status === 'done'

									return (
										<div
											key={urlEntry.id}
											className={`flex items-center justify-between rounded p-2 ${
												isSuccess
													? 'bg-green-50 dark:bg-green-900/20'
													: 'bg-red-50 dark:bg-red-900/20'
											}`}
										>
											<div className="flex items-center gap-2 flex-1 min-w-0">
												<StatusIcon className={`h-3 w-3 ${color}`} />
												<div className="flex flex-col min-w-0">
													<span className="text-sm truncate">
														{urlEntry.url}
													</span>
													{isSuccess &&
														urlEntry.title &&
														urlEntry.title !== 'Analyzing...' && (
															<span className="text-xs text-green-600 dark:text-green-400 truncate">
																{urlEntry.title}
															</span>
														)}
												</div>
											</div>
											<Badge variant="outline" className={color}>
												{label}
											</Badge>
										</div>
									)
								})}
							</div>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	)
}
