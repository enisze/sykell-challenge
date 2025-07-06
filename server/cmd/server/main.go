package main

import (
	"github.com/sykell-challenge/server/internal/router"
)

func main() {
	r := router.SetupRouter()
	r.Run() // listen and serve on 0.0.0.0:8080
}