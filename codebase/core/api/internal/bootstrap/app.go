package bootstrap

import (
	"fmt"
	"net/http"

	appsvc "rotexai/core/api/internal/application"
	"rotexai/core/api/internal/config"
	apihttp "rotexai/core/api/internal/http"
	"rotexai/core/api/internal/http/handlers"
	ormdb "rotexai/core/orm/db"
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

	conn, err := ormdb.Open(cfg.DB.DSN)
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}

	// Wire in-memory services for provider-only admin flow.
	inMemory := appsvc.NewInMemoryServices()
	_ = conn

	router := apihttp.NewRouter(handlers.Deps{
		Dashboard:    inMemory.Dashboard,
		Tenant:       inMemory.Tenant,
		Provider:     inMemory.Provider,
		Retrieval:    inMemory.Retrieval,
		Tools:        inMemory.Tools,
		Assistant:    inMemory.Assistant,
		LLMHubOrigin: cfg.LLMHub.Origin,
		ToolsOrigin:  cfg.Tools.Origin,
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
