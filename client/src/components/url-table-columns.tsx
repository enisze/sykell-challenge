import { Badge } from "@/components/ui/badge"
import type { URLEntry, URLStatus } from "@/types/url-analysis"
import type { ColumnDef } from "@tanstack/react-table"

function getStatusVariant(status: URLStatus) {
  switch (status) {
    case "done":
      return "default"
    case "running":
      return "secondary"
    case "error":
      return "destructive"
    case "queued":
      return "outline"
    case "stopped":
      return "secondary"
    default:
      return "outline"
  }
}

export const urlTableColumns: ColumnDef<URLEntry>[] = [
  {
    accessorKey: "url",
    header: "URL",
    cell: ({ row }) => (
      <div className="max-w-xs truncate">
        <a
          href={row.getValue("url")}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline font-medium"
        >
          {row.getValue("url")}
        </a>
      </div>
    ),
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => <div className="max-w-xs truncate">{row.getValue("title")}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    meta: {
      filterVariant: 'select',
    },
    cell: ({ row }) => {
      const status = row.getValue("status") as URLStatus
      const crawlProgress = row.original.crawlProgress
      return (
        <Badge variant={getStatusVariant(status)}>
          {status}
          {status === "running" && crawlProgress && (
            <span className="ml-1">({Math.round(crawlProgress)}%)</span>
          )}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value === "all" || value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "htmlVersion",
    header: "HTML Version",
    cell: ({ row }) => <div>{row.getValue("htmlVersion")}</div>,
  },
  {
    accessorKey: "internalLinks",
    header: "Internal Links",
    meta: {
      filterVariant: 'range',
    },
    cell: ({ row }) => <div className="text-right">{row.getValue("internalLinks")}</div>,
  },
  {
    accessorKey: "externalLinks",
    header: "External Links",
    meta: {
      filterVariant: 'range',
    },
    cell: ({ row }) => <div className="text-right">{row.getValue("externalLinks")}</div>,
  },
  {
    accessorKey: "brokenLinks",
    header: "Broken Links",
    meta: {
      filterVariant: 'range',
    },
    cell: ({ row }) => <div className="text-right">{row.getValue("brokenLinks")}</div>,
  },
  {
    accessorKey: "lastUpdated",
    header: "Last Updated",
    cell: ({ row }) => {
      const dateValue = row.getValue("lastUpdated")
      
      // Handle different date formats
      let date: Date
      if (dateValue instanceof Date) {
        date = dateValue
      } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
        date = new Date(dateValue)
      } else {
        // Fallback if date is invalid
        return <div className="text-sm text-muted-foreground">-</div>
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return <div className="text-sm text-muted-foreground">Invalid date</div>
      }
      
      return (
        <div className="text-sm">
          {date.toLocaleDateString()}
          <br />
          <span className="text-muted-foreground">
            {date.toLocaleTimeString()}
          </span>
        </div>
      )
    },
  },
]
