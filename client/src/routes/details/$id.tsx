import { createFileRoute, Navigate, useNavigate } from '@tanstack/react-router'
import { URLDetailsView } from '../../components/url-details-view'
import { useUrls } from '../../hooks/useUrls'
import type { URLEntry } from '../../types/url-analysis'

export const Route = createFileRoute('/details/$id')({
	component: () => {
		const { id } = Route.useParams()
		const { data: urls } = useUrls()
		const navigate = useNavigate()

		const urlEntry = urls.find((url: URLEntry) => url.id === id)

		if (!urlEntry) {
			return <Navigate to="/" />
		}

		return (
			<URLDetailsView
				urlEntry={urlEntry}
				onBack={() => navigate({ to: '/' })}
			/>
		)
	},
})
