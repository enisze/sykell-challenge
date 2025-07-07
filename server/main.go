package main

import (
	"log"

	"github.com/joho/godotenv"
	"github.com/sykell-challenge/server/internal/database"
	"github.com/sykell-challenge/server/internal/router"
)

func main() {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found or error loading .env file:", err)
	} else {
		log.Println("Successfully loaded .env file")
	}

	if err := database.Connect(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	log.Println("Database connection successful")

	r := router.SetupRouter()
	log.Println("Router setup complete")
	
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}