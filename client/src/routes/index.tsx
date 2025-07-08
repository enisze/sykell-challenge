import { createFileRoute } from '@tanstack/react-router'
import { QueueStatusComponent } from '../components/queue-status'
import URLAnalyzerDashboard from '../components/url-analyzer-dashboard'
import { URLInputForm } from '../components/url-input-form'

export const Route = createFileRoute('/')({
	component: () => (
		<div className="space-y-6">
			<URLInputForm />
			<URLAnalyzerDashboard />
			<QueueStatusComponent />
		</div>
	),
})
