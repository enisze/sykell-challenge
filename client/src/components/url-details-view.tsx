import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { URLEntry } from "@/types/url-analysis"
import { ArrowLeft, Calendar, Clock, ExternalLink, Globe, Link, X } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface URLDetailsViewProps {
  urlEntry: URLEntry
  onBack: () => void
}

export function URLDetailsView({ urlEntry, onBack }: URLDetailsViewProps) {
  // Prepare data for the chart
  const linkData = [
    { name: 'Internal Links', value: urlEntry.internalLinks, color: '#3B82F6' },
    { name: 'External Links', value: urlEntry.externalLinks, color: '#EF4444' },
    { name: 'Broken Links', value: urlEntry.brokenLinks, color: '#8B5CF6' }
  ]

  const totalLinks = urlEntry.internalLinks + urlEntry.externalLinks

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      if (isNaN(dateObj.getTime())) {
        return 'Invalid date'
      }
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj)
    } catch (error) {
      return 'Invalid date'
    }
  }

  const getStatusColor = (status: URLEntry['status']) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-800'
      case 'running':
        return 'bg-blue-100 text-blue-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'queued':
        return 'bg-yellow-100 text-yellow-800'
      case 'stopped':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Table
          </Button>
          <div>
            <h1 className="text-2xl font-bold">URL Analysis Details</h1>
            <p className="text-muted-foreground">
              Detailed analysis for {urlEntry.url}
            </p>
          </div>
        </div>
        <Badge className={getStatusColor(urlEntry.status)}>
          {urlEntry.status}
        </Badge>
      </div>

      {/* Basic Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Website Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">URL</label>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                  {urlEntry.url}
                </span>
                <Button variant="ghost" size="sm" asChild>
                  <a href={urlEntry.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Title</label>
              <p className="mt-1">{urlEntry.title}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">HTML Version</label>
              <p className="mt-1">{urlEntry.htmlVersion}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(urlEntry.lastUpdated)}</span>
              </div>
            </div>
          </div>
          {urlEntry.processingTime && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Processing Time</label>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{urlEntry.processingTime}ms</span>
              </div>
            </div>
          )}
          {urlEntry.errorMessage && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Error</label>
              <p className="mt-1 text-red-600">{urlEntry.errorMessage}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Links Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Link Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of internal vs external links found on the page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={linkData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${((percent || 0) * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {linkData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart Alternative */}
        <Card>
          <CardHeader>
            <CardTitle>Link Statistics</CardTitle>
            <CardDescription>
              Detailed breakdown of all link types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={linkData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Links</p>
                <p className="text-2xl font-bold">{totalLinks}</p>
              </div>
              <Link className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Internal</p>
                <p className="text-2xl font-bold text-blue-600">{urlEntry.internalLinks}</p>
              </div>
              <div className="h-6 w-6 rounded-full bg-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">External</p>
                <p className="text-2xl font-bold text-red-600">{urlEntry.externalLinks}</p>
              </div>
              <div className="h-6 w-6 rounded-full bg-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Broken</p>
                <p className="text-2xl font-bold text-purple-600">{urlEntry.brokenLinks}</p>
              </div>
              <div className="h-6 w-6 rounded-full bg-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Broken Links Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <X className="h-5 w-5 text-red-600" />
            Broken Links Analysis
          </CardTitle>
          <CardDescription>
            Status of link validation on this page
          </CardDescription>
        </CardHeader>
        <CardContent>
          {urlEntry.brokenLinks > 0 ? (
            <div className="space-y-4">
              <div className="text-center py-4">
                <X className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <p className="text-lg font-medium text-red-600">
                  {urlEntry.brokenLinks} Broken Link{urlEntry.brokenLinks > 1 ? 's' : ''} Detected
                </p>
                <p className="text-muted-foreground mt-2">
                  The analysis found {urlEntry.brokenLinks} non-functional link{urlEntry.brokenLinks > 1 ? 's' : ''} on this page.
                </p>
              </div>
              
              {urlEntry.brokenLinkDetails && urlEntry.brokenLinkDetails.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Broken Link Details:</h4>
                  <div className="space-y-2">
                    {urlEntry.brokenLinkDetails.map((brokenLink, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-red-50">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-red-900 truncate">
                              {brokenLink.url}
                            </p>
                            {brokenLink.error && (
                              <p className="text-xs text-red-600 mt-1">
                                {brokenLink.error}
                              </p>
                            )}
                          </div>
                          <Badge variant="destructive" className="shrink-0">
                            {brokenLink.statusCode}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Link className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-lg font-medium text-green-600">
                No Broken Links Found
              </p>
              <p className="text-muted-foreground mt-2">
                All links on this page appear to be functional and accessible.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
