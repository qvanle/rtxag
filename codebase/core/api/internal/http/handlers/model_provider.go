package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"rotexai/core/api/internal/application"
	"rotexai/core/api/internal/http/response"
)

func (h *Handler) ListProviders(w http.ResponseWriter, r *http.Request) {
	rows, err := h.deps.Provider.List(r.Context())
	if err != nil {
		response.Error(w, 500, "list_providers_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 200, rows, nil)
}
func (h *Handler) CreateProvider(w http.ResponseWriter, r *http.Request) {
	var req application.CreateProviderRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	row, err := h.deps.Provider.Create(r.Context(), req)
	if err != nil {
		response.Error(w, 422, "create_provider_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 201, row, nil)
}
func (h *Handler) UpdateProvider(w http.ResponseWriter, r *http.Request) {
	var req application.UpdateProviderRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	row, err := h.deps.Provider.Update(r.Context(), chi.URLParam(r, "provider_id"), req)
	if err != nil {
		response.Error(w, 422, "update_provider_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 200, row, nil)
}

func (h *Handler) DeleteProvider(w http.ResponseWriter, r *http.Request) {
	if err := h.deps.Provider.Delete(r.Context(), chi.URLParam(r, "provider_id")); err != nil {
		response.Error(w, 409, "delete_provider_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 200, map[string]bool{"ok": true}, nil)
}
