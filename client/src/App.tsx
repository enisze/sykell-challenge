import { Toaster } from "sonner"
import { URLInputForm } from "./components/url-input-form"
import "./index.css"

function App() {
  return (
    <div className="container mx-auto p-6">
      <URLInputForm />
      <Toaster />
    </div>
  )
}

export default App
