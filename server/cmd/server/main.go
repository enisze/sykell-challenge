package main

import (
	"log"

	"github.com/sykell-challenge/server/internal/database"
	"github.com/sykell-challenge/server/internal/router"
)

func main() {
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