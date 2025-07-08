import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { urlTableColumns } from '@/components/url-table-columns'
import { useUrlQueue } from '@/hooks/useUrlQueue'
import { deleteUrlsAtom, rerunUrlsWithQueueAtom } from '@/store/urlStore'
import type { URLEntry } from '@/types/url-analysis'
import { useNavigate } from '@tanstack/react-router'
import {
	type Column,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type RowSelectionState,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from '@tanstack/react-table'
import { useDebounce } from '@uidotdev/usehooks'
import { useSetAtom } from 'jotai'
import { ChevronDown, ChevronUp, RefreshCw, Search, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { DataTablePagination } from './data-table-pagination'

type FilterVariant = 'text' | 'select' | 'range'

interface ColumnMeta {
	filterVariant?: FilterVariant
}

type RangeFilter = [number | undefined, number | undefined]

// Filter component for each column
function Filter({ column }: { column: Column<URLEntry, unknown> }) {
	const columnFilterValue = column.getFilterValue()
	const filterVariant =
		(column.columnDef.meta as ColumnMeta)?.filterVariant ?? 'text'

	// For text filters
	const [searchValue, setSearchValue] = useState(
		filterVariant === 'text' ? ((columnFilterValue as string) ?? '') : '',
	)
	const debouncedSearchValue = useDebounce(searchValue, 500)

	const rangeValue =
		filterVariant === 'range' ? (columnFilterValue as RangeFilter) : undefined
	const [minValue, setMinValue] = useState(rangeValue?.[0]?.toString() ?? '')
	const [maxValue, setMaxValue] = useState(rangeValue?.[1]?.toString() ?? '')
	const debouncedMinValue = useDebounce(minValue, 500)
	const debouncedMaxValue = useDebounce(maxValue, 500)

	// Update column filter when debounced values change
	useEffect(() => {
		if (filterVariant === 'text') {
			column.setFilterValue(debouncedSearchValue || undefined)
		}
	}, [debouncedSearchValue, column, filterVariant])

	useEffect(() => {
		if (filterVariant === 'range') {
			const min =
				debouncedMinValue === '' ? undefined : Number(debouncedMinValue)
			const max =
				debouncedMaxValue === '' ? undefined : Number(debouncedMaxValue)
			if (min !== undefined || max !== undefined) {
				column.setFilterValue([min, max])
			} else {
				column.setFilterValue(undefined)
			}
		}
	}, [debouncedMinValue, debouncedMaxValue, column, filterVariant])

	return filterVariant === 'range' ? (
		<div>
			<div className="flex space-x-2">
				<Input
					type="number"
					value={minValue}
					onChange={(e) => setMinValue(e.target.value)}
					placeholder="Min"
					className="w-24 text-sm"
				/>
				<Input
					type="number"
					value={maxValue}
					onChange={(e) => setMaxValue(e.target.value)}
					placeholder="Max"
					className="w-24 text-sm"
				/>
			</div>
		</div>
	) : filterVariant === 'select' ? (
		<Select
			value={columnFilterValue?.toString() ?? 'all'}
			onValueChange={(value) =>
				column.setFilterValue(value === 'all' ? undefined : value)
			}
		>
			<SelectTrigger className="w-full">
				<SelectValue placeholder="All" />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="all">All</SelectItem>
				<SelectItem value="done">Done</SelectItem>
				<SelectItem value="running">Running</SelectItem>
				<SelectItem value="queued">Queued</SelectItem>
				<SelectItem value="error">Error</SelectItem>
				<SelectItem value="stopped">Stopped</SelectItem>
			</SelectContent>
		</Select>
	) : (
		<Input
			className="w-full text-sm"
			onChange={(e) => setSearchValue(e.target.value)}
			placeholder="Search..."
			type="text"
			value={searchValue}
		/>
	)
}

interface URLTableProps {
	data: URLEntry[]
	isLoading: boolean
}

export function URLTable({ data, isLoading }: URLTableProps) {
	const navigate = useNavigate()
	const [sorting, setSorting] = useState<SortingState>([
		{
			id: 'lastUpdated',
			desc: true,
		},
	])
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
	const [globalFilter, setGlobalFilter] = useState('')

	const deleteUrls = useSetAtom(deleteUrlsAtom)
	const rerunUrlsWithQueue= useSetAtom(rerunUrlsWithQueueAtom)
	const { addToQueue, startProcessing } = useUrlQueue()

	const table = useReactTable({
		data,
		columns: urlTableColumns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onGlobalFilterChange: setGlobalFilter,
		onRowSelectionChange: setRowSelection,
		enableRowSelection: true,
		getRowId: (row) => row.id,
		globalFilterFn: 'includesString',
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
			globalFilter,
		},
		initialState: {
			pagination: {
				pageSize: 10,
			},
		},
	})

	const selectedRowIds = Object.keys(rowSelection).filter(
		(key) => rowSelection[key],
	)
	const selectedCount = selectedRowIds.length

	const handleDeleteSelected = () => {
		if (selectedRowIds.length > 0) {
			deleteUrls(selectedRowIds)
			setRowSelection({})
		}
	}

	const handleRerunSelected = () => {
		if (selectedRowIds.length > 0) {
			rerunUrlsWithQueue({ urlIds: selectedRowIds, addToQueue })
			setRowSelection({})

			startProcessing()
		}
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-lg">Loading...</div>
			</div>
		)
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2 p-3 bg-muted rounded-lg">
				<span className="text-sm font-medium text-center sm:text-left">
					{selectedCount > 0
						? `${selectedCount} row${selectedCount > 1 ? 's' : ''} selected`
						: 'Select rows to perform bulk actions'}
				</span>
				<div className="flex flex-col gap-2 sm:flex-row sm:gap-2 sm:ml-auto">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								onClick={handleDeleteSelected}
								disabled={selectedCount === 0}
								className="w-full sm:w-auto text-xs sm:text-sm"
							>
								<Trash2 className="h-4 w-4 mr-2" />
								Delete Selected
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							{selectedCount === 0
								? 'Select rows to delete them'
								: `Delete ${selectedCount} selected row${selectedCount > 1 ? 's' : ''}`}
						</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								onClick={handleRerunSelected}
								disabled={selectedCount === 0}
								className="w-full sm:w-auto text-xs sm:text-sm"
							>
								<RefreshCw className="h-4 w-4 mr-2" />
								Rerun Analysis
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							{selectedCount === 0
								? 'Select rows to rerun their analysis'
								: `Rerun analysis for ${selectedCount} selected row${selectedCount > 1 ? 's' : ''}`}
						</TooltipContent>
					</Tooltip>
				</div>
			</div>

			{/* Filters */}
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search all columns..."
						value={globalFilter ?? ''}
						onChange={(event) => setGlobalFilter(String(event.target.value))}
						className="pl-10"
					/>
				</div>
				<Select
					value={
						(table.getColumn('status')?.getFilterValue() as string) ?? 'all'
					}
					onValueChange={(value) =>
						table
							.getColumn('status')
							?.setFilterValue(value === 'all' ? undefined : value)
					}
				>
					<SelectTrigger className="w-full sm:w-[180px]">
						<SelectValue placeholder="Filter by status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Statuses</SelectItem>
						<SelectItem value="done">Done</SelectItem>
						<SelectItem value="running">Running</SelectItem>
						<SelectItem value="queued">Queued</SelectItem>
						<SelectItem value="error">Error</SelectItem>
						<SelectItem value="stopped">Stopped</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder ? null : (
												<div
													className={
														header.column.getCanSort()
															? 'cursor-pointer select-none font-semibold flex items-center'
															: 'font-semibold'
													}
													onClick={header.column.getToggleSortingHandler()}
													title={
														header.column.getCanSort()
															? header.column.getNextSortingOrder() === 'asc'
																? 'Sort ascending'
																: header.column.getNextSortingOrder() === 'desc'
																	? 'Sort descending'
																	: 'Clear sort'
															: undefined
													}
												>
													{flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
													{header.column.getCanSort() && (
														<>
															{header.column.getIsSorted() === 'asc' ? (
																<ChevronUp className="ml-1 h-4 w-4" />
															) : header.column.getIsSorted() === 'desc' ? (
																<ChevronDown className="ml-1 h-4 w-4" />
															) : null}
														</>
													)}
												</div>
											)}
										</TableHead>
									)
								})}
							</TableRow>
						))}
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={`${headerGroup.id}-filters`}>
								{headerGroup.headers.map((header) => (
									<TableHead key={`${header.id}-filter`} className="p-2">
										{header.column.getCanFilter() ? (
											<Filter column={header.column} />
										) : null}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && 'selected'}
									className="cursor-pointer hover:bg-muted/50"
									onClick={() =>
										navigate({
											to: '/details/$id',
											params: { id: row.original.id },
										})
									}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={urlTableColumns.length}
									className="h-24 text-center"
								>
									No results found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<DataTablePagination table={table} />
		</div>
	)
}
