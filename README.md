# URL Analyzer

A simple URL analyzer with React frontend, Go backend, and MySQL database.

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Go + Gin + GORM  
- **Database**: MySQL 8.0

## Quick Start

### With Docker (Recommended)
```bash
docker-compose up -d

# Access app at http://localhost:3000
```

### Manual Setup
```bash
# 1. Start database
docker-compose up -d database

# 2. Start backend
cd server
go run main.go

# 3. Start frontend
cd client
pnpm install && pnpm dev
```

## Features
- Submit URLs for analysis
- Extract HTML metadata (title, headings, links)
- Cache results in MySQL
- API key authentication
