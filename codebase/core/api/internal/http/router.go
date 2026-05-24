package http

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/httplog/v2"

	"rotexai/core/api/internal/http/handlers"
	"rotexai/core/api/internal/http/middleware"
)

func NewRouter(deps handlers.Deps) http.Handler {
	r := chi.NewRouter()
	logger := httplog.NewLogger("admin-api", httplog.Options{JSON: true})

	r.Use(httplog.RequestLogger(logger))
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Timeout(30 * time.Second))
	r.Use(middleware.RequireGatewayHeaders)
	r.Use(middleware.RequireSystemAdmin)

	h := handlers.New(deps)
	r.Get("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	r.Route("/api/admin", func(r chi.Router) {
		r.Get("/dashboard/global", h.GetDashboardGlobal)
		r.Get("/dashboard/tenants", h.ListDashboardTenants)

		r.Get("/models", h.ListModels)
		r.Post("/models", h.CreateModel)
		r.Get("/models/{model_id}", h.GetModel)
		r.Patch("/models/{model_id}", h.UpdateModel)
		r.Delete("/models/{model_id}", h.DeleteModel)

		r.Get("/providers", h.ListProviders)
		r.Post("/providers", h.CreateProvider)
		r.Patch("/providers/{provider_id}", h.UpdateProvider)
		r.Post("/providers/{provider_id}/toggle", h.ToggleProvider)
		r.Post("/providers/reorder", h.ReorderProviders)

		r.Get("/retrieval/collections", h.ListRetrievalCollections)
		r.Post("/retrieval/collections", h.CreateRetrievalCollection)
		r.Get("/retrieval/collections/{collection_id}", h.GetRetrievalCollection)
		r.Patch("/retrieval/collections/{collection_id}", h.UpdateRetrievalCollection)
		r.Delete("/retrieval/collections/{collection_id}", h.DeleteRetrievalCollection)
		r.Get("/retrieval/collections/{collection_id}/documents", h.ListRetrievalDocuments)
		r.Post("/retrieval/collections/{collection_id}/documents", h.CreateRetrievalDocument)
		r.Delete("/retrieval/collections/{collection_id}/documents/{document_id}", h.DeleteRetrievalDocument)
		r.Post("/retrieval/collections/{collection_id}/reindex", h.ReindexRetrievalCollection)

		r.Get("/mcp/collections", h.ListMCPCollections)
		r.Post("/mcp/collections", h.CreateMCPCollection)
		r.Get("/mcp/collections/{collection_id}", h.GetMCPCollection)
		r.Patch("/mcp/collections/{collection_id}", h.UpdateMCPCollection)
		r.Delete("/mcp/collections/{collection_id}", h.DeleteMCPCollection)
		r.Get("/mcp/collections/{collection_id}/records", h.ListMCPRecords)
		r.Post("/mcp/collections/{collection_id}/records", h.CreateMCPRecord)
		r.Patch("/mcp/collections/{collection_id}/records/{record_id}", h.UpdateMCPRecord)
		r.Delete("/mcp/collections/{collection_id}/records/{record_id}", h.DeleteMCPRecord)

		r.Get("/assistants", h.ListAssistants)
		r.Post("/assistants", h.CreateAssistant)
		r.Get("/assistants/{assistant_id}", h.GetAssistant)
		r.Patch("/assistants/{assistant_id}", h.UpdateAssistant)
		r.Delete("/assistants/{assistant_id}", h.DeleteAssistant)
		r.Post("/assistants/{assistant_id}/activate", h.ActivateAssistant)
		r.Post("/assistants/{assistant_id}/clone", h.CloneAssistant)
	})

	return r
}
