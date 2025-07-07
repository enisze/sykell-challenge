import { Toaster } from "sonner"
import { QueueStatusComponent } from "./components/queue-status"
import URLAnalyzerDashboard from "./components/url-analyzer-dashboard"
import { URLInputForm } from "./components/url-input-form"
import "./index.css"

function App() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <URLInputForm />
      <URLAnalyzerDashboard/>
      <QueueStatusComponent />
      <Toaster />
    </div>
  )
}

export default App
