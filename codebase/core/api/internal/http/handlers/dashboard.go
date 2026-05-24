package handlers

import (
	"net/http"

	"rotexai/core/api/internal/http/response"
)

func (h *Handler) GetDashboardGlobal(w http.ResponseWriter, r *http.Request) {
	row, err := h.deps.Dashboard.GetGlobal(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "dashboard_global_failed", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusOK, row, nil)
}

func (h *Handler) ListDashboardTenants(w http.ResponseWriter, r *http.Request) {
	rows, err := h.deps.Dashboard.ListTenants(r.Context(), paginationFromRequest(r), r.URL.Query().Get("plan"), r.URL.Query().Get("status"))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "dashboard_tenants_failed", err.Error(), nil)
		return
	}
	response.JSON(w, http.StatusOK, rows, nil)
}
