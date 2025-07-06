# URL Analyzer Server

A simple Go server that analyzes URLs and caches results in MySQL.

## Features

- Single endpoint to analyze multiple URLs
- Checks database cache first, scrapes if not found
- Stores analysis results in MySQL
- API key authentication

## Quick Setup with Docker

1. Start MySQL database:
   ```bash
   docker-compose up -d
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Edit API_KEY in .env file
   ```

3. Run server:
   ```bash
   go run cmd/server/main.go
   ```

## API

### Public Endpoints:
- `GET /health` - Health check endpoint (returns `{"status": "healthy"}`)

### Protected Endpoints (require `X-API-Key` header):
- `POST /api/analyze-urls` - Analyze URLs (returns cached results if available)

### Request Format:
```json
{
  "urls": ["https://example.com", "https://google.com"]
}
```

### Response Format:
```json
{
  "results": [
    {
      "url": "https://example.com",
      "htmlVersion": "HTML5",
      "pageTitle": "Example Domain",
      "headingCounts": {"H1": 1, "H2": 0},
      "internalLinks": 1,
      "externalLinks": 1,
      "hasLoginForm": false
    }
  ]
}
```

## Example

```bash
curl -X POST http://localhost:8080/api/analyze-urls \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key" \
  -d '{"urls": ["https://example.com"]}'
```

## How it works

1. For each URL in the request, check if it exists in the database
2. If found, return the cached analysis
3. If not found, scrape the URL and analyze it
4. Save the new analysis to the database
5. Return results for all URLs
