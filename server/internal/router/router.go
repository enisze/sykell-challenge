package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sykell-challenge/server/internal/handler"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()
	r.GET("/ping", handler.Ping)
	return r
}