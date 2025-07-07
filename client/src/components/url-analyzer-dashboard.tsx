import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useUrls } from "@/hooks/useUrls"
import { URLTable } from "./url-table"

export default function URLAnalyzerDashboard() {
  const { data: urls = [], isLoading } = useUrls()

  return (
    <Card>
      <CardHeader>
        <CardTitle>URL Analysis Dashboard</CardTitle>
        <CardDescription>
          View and analyze URL data with sorting, filtering, and pagination
        </CardDescription>
      </CardHeader>
      <CardContent>
        <URLTable data={urls} isLoading={isLoading} />
      </CardContent>
    </Card>
  )
}
