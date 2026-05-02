package main

import (
	"net/http"
	"os"
	"os/signal"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/rs/zerolog/log"
	"github.com/smithg09/core/cmd/core/graph"
	db "github.com/smithg09/core/internal/actor/db/sql"
	"github.com/smithg09/core/internal/actor/server"
	"github.com/smithg09/core/internal/module/earnedskill"
	"github.com/smithg09/core/internal/module/session"
	"github.com/smithg09/core/internal/module/user"
	"github.com/smithg09/core/internal/util/config"
	"github.com/smithg09/core/internal/util/logger"
)

func main() {
	// Init Config
	//
	c := config.NewConfig()
	err := c.LoadConfigFile(".", "env", ".env")
	if err != nil {
		log.
			Error().
			Msg(err.Error())
	}

	// Init Logger
	//
	logger.InitLogger(c.GetString("LOG_LEVEL"), c.GetString("ENVIRONMENT"))

	// Init Databases

	pdb := db.NewPostgresDB(
		c.GetString("POSTGRES_DATABASE"),
		c.GetString("POSTGRES_URI"),
		c.GetBool("POSTGRES_IS_SSL_DISABLED"),
	).Connect()
	defer pdb.Disconnect()

	// Initialize Domain Modules
	//
	userModule := user.NewUserModule(pdb)
	sessionModule := session.NewSessionModule(pdb)
	earnedSkillModule := earnedskill.NewEarnedSkillModule(pdb)

	// Init Gql
	//
	resolver := graph.Resolver{
		UserService:        userModule.GetService(),
		SessionService:     sessionModule.GetService(),
		EarnedSkillService: earnedSkillModule.GetService(),
	}
	config := graph.Config{Resolvers: &resolver}
	queryHandler := handler.NewDefaultServer(graph.NewExecutableSchema(config))

	// Init Http Server
	//
	es := server.NewEchoServer(8080)
	so := es.GetOperations()
	so.UseRecover()
	so.UseCors()
	so.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"healthy","service":"user-service"}`))
	})
	so.Get("/", playground.Handler("Golang Blog Starter", "/query"))
	so.Post("/query", queryHandler.ServeHTTP)

	// Start server
	go es.Start()
	// Stop server gracefully
	// Wait for interrupt signal to gracefully shutdown the server with a timeout of 10 seconds.
	// Use a buffered channel to avoid missing signals as recommended for signal.Notify
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt)
	<-quit
	es.Stop()
}
