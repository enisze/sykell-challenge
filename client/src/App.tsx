import { useState } from 'react';
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";

function App() {
  const [urls, setUrls] = useState<string[]>([]);
  const [currentUrl, setCurrentUrl] = useState<string>('');

  const handleAddUrl = () => {
    if (currentUrl && !urls.includes(currentUrl)) {
      setUrls([...urls, currentUrl]);
      setCurrentUrl('');
    }
  };

  const handleRemoveUrl = (urlToRemove: string) => {
    setUrls(urls.filter(url => url !== urlToRemove));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-center">URL Crawler</h2>
        <div className="flex items-center space-x-2 mb-4">
          <Input
            type="url"
            placeholder="Enter URL and press Add"
            value={currentUrl}
            onChange={(e) => setCurrentUrl(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddUrl();
              }
            }}
          />
          <Button onClick={handleAddUrl}>Add</Button>
        </div>

        {urls.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">URLs to Crawl:</h3>
            <ul className="list-disc list-inside space-y-1">
              {urls.map((url) => (
                <li key={url} className="flex justify-between items-center text-gray-700">
                  {url}
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveUrl(url)}>
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={urls.length === 0}>
          Start Crawl
        </Button>
      </div>
    </div>
  );
}

export default App;
