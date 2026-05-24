package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"rotexai/core/api/internal/application"
	"rotexai/core/api/internal/http/response"
)

func (h *Handler) ListTenants(w http.ResponseWriter, r *http.Request) {
	rows, err := h.deps.Tenant.List(r.Context(), paginationFromRequest(r))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "list_tenants_failed", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusOK, rows, nil)
}

func (h *Handler) CreateTenant(w http.ResponseWriter, r *http.Request) {
	var req application.CreateTenantRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	row, err := h.deps.Tenant.Create(r.Context(), req)
	if err != nil {
		response.Error(w, http.StatusUnprocessableEntity, "create_tenant_failed", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusCreated, row, nil)
}

func (h *Handler) UpdateTenant(w http.ResponseWriter, r *http.Request) {
	var req application.UpdateTenantRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	row, err := h.deps.Tenant.Update(r.Context(), chi.URLParam(r, "id_internal"), req)
	if err != nil {
		response.Error(w, http.StatusUnprocessableEntity, "update_tenant_failed", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusOK, row, nil)
}

func (h *Handler) DeleteTenant(w http.ResponseWriter, r *http.Request) {
	if err := h.deps.Tenant.Delete(r.Context(), chi.URLParam(r, "id_internal")); err != nil {
		response.Error(w, http.StatusConflict, "delete_tenant_failed", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusOK, map[string]bool{"ok": true}, nil)
}
