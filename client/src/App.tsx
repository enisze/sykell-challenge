import { Toaster } from "sonner"
import URLAnalyzerDashboard from "./components/url-analyzer-dashboard"
import { URLInputForm } from "./components/url-input-form"
import "./index.css"

function App() {
  return (
    <div className="container mx-auto p-6">
      <URLInputForm />
      <URLAnalyzerDashboard/>
      <Toaster />
    </div>
  )
}

export default App
