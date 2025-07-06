# URL Analyzer - Full Stack

Simple URL analyzer with React frontend, Go backend, and MySQL database.

## Quick Start

### Option 1: Everything with Docker (Recommended)
```bash
# Start everything
docker-compose up -d

# Access the app
# Frontend: http://localhost:3000
# Backend: http://localhost:8080

# Stop everything
docker-compose down
```

### Option 2: Local Development
```bash
# 1. Start only the database
docker-compose up -d database

# 2. Configure server
cd server
cp .env.example .env
# Edit .env and set API_KEY=your-secret-key

# 3. Start server (in one terminal)
go run cmd/server/main.go

# 4. Start client (in another terminal)
cd client
pnpm install
pnpm run dev
```

## API Usage

```bash
curl -X POST http://localhost:8080/api/analyze-urls \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-key" \
  -d '{"urls": ["https://example.com"]}'
```

## Features

- Submit multiple URLs for analysis
- Automatic caching in MySQL (checks cache before scraping)
- HTML metadata extraction (title, headings, links, forms)
- API key authentication
- React frontend for easy interaction

## Architecture

- **Frontend**: React + TypeScript + Vite (port 3000)
- **Backend**: Go + Gin + GORM (port 8080)  
- **Database**: MySQL 8.0 (port 3306)

### Database Setup
```sql
CREATE DATABASE url_analyzer;
```

## API Usage

The backend provides a single endpoint:

**POST** `/api/analyze-urls`
- Requires `X-API-Key` header
- Input: `{"urls": ["https://example.com", "..."]}`
- Output: Analysis results with caching

### Example:
```bash
curl -X POST http://localhost:8080/api/analyze-urls \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key" \
  -d '{"urls": ["https://example.com"]}'
```

## Features

### Backend
- ✅ Single endpoint for URL analysis
- ✅ Smart caching (checks database first)
- ✅ HTML metadata extraction (title, headings, links, forms)
- ✅ API key authentication
- ✅ MySQL persistence

### Frontend
- ✅ Modern React with TypeScript
- ✅ Clean UI for URL submission
- ✅ Results display with analysis data
- ✅ Responsive design

## Project Structure

```
/
├── docker-compose.yml          # Full stack orchestration
├── server/                     # Go backend
│   ├── cmd/server/main.go     # Entry point
│   ├── internal/              # Application code
│   ├── Dockerfile             # Server container
│   └── .env.example           # Environment template
├── client/                     # React frontend
│   ├── src/                   # Source code
│   ├── Dockerfile             # Client container
│   └── package.json           # Dependencies
└── README.md                   # This file
```

## Environment Variables

### Server (.env)
```
DB_HOST=localhost              # Use 'database' for Docker
DB_PORT=3306
DB_USER=user
DB_PASSWORD=password
DB_NAME=url_analyzer
API_KEY=your-secret-api-key
```

## How It Works

1. **Submit URLs** via the React frontend
2. **Backend checks** MySQL cache for existing analysis
3. **If cached**: Returns stored results immediately
4. **If not cached**: Scrapes URL, analyzes HTML, saves to database
5. **Frontend displays** results with metadata (title, headings, links, etc.)

Perfect for URL analysis with persistent caching and a clean user interface!
