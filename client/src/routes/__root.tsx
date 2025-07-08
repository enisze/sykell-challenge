import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Toaster } from 'sonner'
import '../index.css'

export const Route = createRootRoute({
	component: () => (
		<>
			<div className="container mx-auto p-6">
				<Outlet />
				<Toaster />
			</div>
			<TanStackRouterDevtools />
		</>
	),
})
