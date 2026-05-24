package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"rotexai/core/api/internal/application"
	"rotexai/core/api/internal/http/response"
)

func (h *Handler) ListModels(w http.ResponseWriter, r *http.Request) {
	rows, err := h.deps.Model.List(r.Context())
	if err != nil {
		response.Error(w, 500, "list_models_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 200, rows, nil)
}
func (h *Handler) CreateModel(w http.ResponseWriter, r *http.Request) {
	var req application.CreateModelRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	row, err := h.deps.Model.Create(r.Context(), req)
	if err != nil {
		response.Error(w, 422, "create_model_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 201, row, nil)
}
func (h *Handler) GetModel(w http.ResponseWriter, r *http.Request) {
	row, err := h.deps.Model.Get(r.Context(), chi.URLParam(r, "model_id"))
	if err != nil {
		response.Error(w, 404, "model_not_found", err.Error(), nil)
		return
	}
	response.JSON(w, 200, row, nil)
}
func (h *Handler) UpdateModel(w http.ResponseWriter, r *http.Request) {
	var req application.UpdateModelRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	row, err := h.deps.Model.Update(r.Context(), chi.URLParam(r, "model_id"), req)
	if err != nil {
		response.Error(w, 422, "update_model_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 200, row, nil)
}
func (h *Handler) DeleteModel(w http.ResponseWriter, r *http.Request) {
	if err := h.deps.Model.Delete(r.Context(), chi.URLParam(r, "model_id")); err != nil {
		response.Error(w, 409, "delete_model_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 200, map[string]bool{"ok": true}, nil)
}

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
func (h *Handler) ToggleProvider(w http.ResponseWriter, r *http.Request) {
	row, err := h.deps.Provider.Toggle(r.Context(), chi.URLParam(r, "provider_id"))
	if err != nil {
		response.Error(w, 404, "toggle_provider_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 200, row, nil)
}
func (h *Handler) ReorderProviders(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ProviderIDs []string `json:"provider_ids"`
	}
	if !decodeJSON(w, r, &req) {
		return
	}
	if err := h.deps.Provider.Reorder(r.Context(), req.ProviderIDs); err != nil {
		response.Error(w, 422, "reorder_provider_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 200, map[string]bool{"ok": true}, nil)
}
