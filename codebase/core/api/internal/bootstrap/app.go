package bootstrap

import (
	"fmt"
	"net/http"

	appsvc "rotexai/core/api/internal/application"
	"rotexai/core/api/internal/config"
	apihttp "rotexai/core/api/internal/http"
	"rotexai/core/api/internal/http/handlers"
	"rotexai/core/api/internal/infrastructure/db"
)

type App struct {
	Config config.Config
	Server *http.Server
}

func NewApp() (*App, error) {
	cfg, err := config.Load()
	if err != nil {
		return nil, fmt.Errorf("load config: %w", err)
	}

	_, err = db.Open(cfg.DB.DSN)
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}

	svcs := appsvc.NewInMemoryServices()
	router := apihttp.NewRouter(handlers.Deps{
		Dashboard: svcs.Dashboard,
		Model:     svcs.Model,
		Provider:  svcs.Provider,
		Retrieval: svcs.Retrieval,
		MCP:       svcs.MCP,
		Assistant: svcs.Assistant,
	})

	server := &http.Server{
		Addr:         cfg.HTTP.Addr,
		Handler:      router,
		ReadTimeout:  cfg.HTTP.ReadTimeout,
		WriteTimeout: cfg.HTTP.WriteTimeout,
		IdleTimeout:  cfg.HTTP.IdleTimeout,
	}

	return &App{Config: cfg, Server: server}, nil
}
