import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@/components/ui/pagination'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import type { Table } from '@tanstack/react-table'

interface DataTablePaginationProps<TData> {
	table: Table<TData>
}

export function DataTablePagination<TData>({
	table,
}: DataTablePaginationProps<TData>) {
	const currentPage = table.getState().pagination.pageIndex + 1
	const totalPages = table.getPageCount()

	const renderPageNumbers = () => {
		const pages = []
		const maxVisiblePages = 5

		if (totalPages <= maxVisiblePages) {
			// Show all pages if we have 5 or fewer
			for (let i = 1; i <= totalPages; i++) {
				pages.push(
					<PaginationItem key={i}>
						<PaginationLink
							href="#"
							onClick={(e) => {
								e.preventDefault()
								table.setPageIndex(i - 1)
							}}
							isActive={currentPage === i}
						>
							{i}
						</PaginationLink>
					</PaginationItem>,
				)
			}
		} else {
			// Always show first page
			pages.push(
				<PaginationItem key={1}>
					<PaginationLink
						href="#"
						onClick={(e) => {
							e.preventDefault()
							table.setPageIndex(0)
						}}
						isActive={currentPage === 1}
					>
						1
					</PaginationLink>
				</PaginationItem>,
			)

			// Show ellipsis if current page is far from start
			if (currentPage > 3) {
				pages.push(
					<PaginationItem key="start-ellipsis">
						<PaginationEllipsis />
					</PaginationItem>,
				)
			}

			// Show pages around current page
			const start = Math.max(2, currentPage - 1)
			const end = Math.min(totalPages - 1, currentPage + 1)

			for (let i = start; i <= end; i++) {
				if (i !== 1 && i !== totalPages) {
					pages.push(
						<PaginationItem key={i}>
							<PaginationLink
								href="#"
								onClick={(e) => {
									e.preventDefault()
									table.setPageIndex(i - 1)
								}}
								isActive={currentPage === i}
							>
								{i}
							</PaginationLink>
						</PaginationItem>,
					)
				}
			}

			// Show ellipsis if current page is far from end
			if (currentPage < totalPages - 2) {
				pages.push(
					<PaginationItem key="end-ellipsis">
						<PaginationEllipsis />
					</PaginationItem>,
				)
			}

			// Always show last page
			if (totalPages > 1) {
				pages.push(
					<PaginationItem key={totalPages}>
						<PaginationLink
							href="#"
							onClick={(e) => {
								e.preventDefault()
								table.setPageIndex(totalPages - 1)
							}}
							isActive={currentPage === totalPages}
						>
							{totalPages}
						</PaginationLink>
					</PaginationItem>,
				)
			}
		}

		return pages
	}

	return (
		<div className="flex flex-col space-y-4 px-2">
			<div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
				<div className="flex items-center space-x-2">
					<p className="text-sm font-medium">Rows per page</p>
					<Select
						value={`${table.getState().pagination.pageSize}`}
						onValueChange={(value) => {
							table.setPageSize(Number(value))
						}}
					>
						<SelectTrigger className="h-8 w-[70px]">
							<SelectValue placeholder={table.getState().pagination.pageSize} />
						</SelectTrigger>
						<SelectContent side="top">
							{[5, 10, 20, 50].map((pageSize) => (
								<SelectItem key={pageSize} value={`${pageSize}`}>
									{pageSize}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="flex items-center justify-center sm:justify-end space-x-2">
					<div className="text-sm font-medium">
						Page {currentPage} of {totalPages}
					</div>
				</div>
			</div>

			<div className="flex justify-center">
				<Pagination>
					<PaginationContent className="flex-wrap justify-center">
						<PaginationItem>
							<PaginationPrevious
								href="#"
								onClick={(e) => {
									e.preventDefault()
									table.previousPage()
								}}
								className={
									!table.getCanPreviousPage()
										? 'pointer-events-none opacity-50'
										: 'cursor-pointer'
								}
							/>
						</PaginationItem>

						<div className="hidden sm:contents">
							{renderPageNumbers()}
						</div>

						<PaginationItem>
							<PaginationNext
								href="#"
								onClick={(e) => {
									e.preventDefault()
									table.nextPage()
								}}
								className={
									!table.getCanNextPage()
										? 'pointer-events-none opacity-50'
										: 'cursor-pointer'
								}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			</div>

			<div className="text-xs text-muted-foreground text-center">
				Showing{' '}
				{table.getState().pagination.pageIndex *
					table.getState().pagination.pageSize +
					1}{' '}
				to{' '}
				{Math.min(
					(table.getState().pagination.pageIndex + 1) *
						table.getState().pagination.pageSize,
					table.getFilteredRowModel().rows.length,
				)}{' '}
				of {table.getFilteredRowModel().rows.length} results
			</div>
		</div>
	)
}
