package bootstrap

import (
	"fmt"
	"net/http"

	appsvc "rotexai/core/api/internal/application"
	"rotexai/core/api/internal/config"
	apihttp "rotexai/core/api/internal/http"
	"rotexai/core/api/internal/http/handlers"
	ormdb "rotexai/core/orm/db"
	modelsvc "rotexai/core/services/model"
	providersvc "rotexai/core/services/provider"
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

	// Phase 1: wire Model + Provider to ORM-backed services.
	// Keep the rest on in-memory services until their repositories are implemented.
	inMemory := appsvc.NewInMemoryServices()
	modelRepo := modelsvc.NewGormRepository(conn)
	providerRepo := providersvc.NewGormRepository(conn)
	modelService := appsvc.NewModelServiceAdapter(modelsvc.NewService(modelRepo))
	providerService := appsvc.NewProviderServiceAdapter(providersvc.NewService(providerRepo))

	router := apihttp.NewRouter(handlers.Deps{
		Dashboard: inMemory.Dashboard,
		Model:     modelService,
		Provider:  providerService,
		Retrieval: inMemory.Retrieval,
		MCP:       inMemory.MCP,
		Assistant: inMemory.Assistant,
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
