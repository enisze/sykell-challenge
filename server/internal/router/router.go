package router

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/sykell-challenge/server/internal/handler"
	"github.com/sykell-challenge/server/internal/middleware"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()
	log.Println("Gin router created")
	
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, X-API-Key, Authorization")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	})
	
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy"})
	})

	api := r.Group("/api")
	api.Use(middleware.APIKeyMiddleware())
	{
		api.POST("/analyze-url", handler.AnalyzeURL)
	}
	
	return r
}