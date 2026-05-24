package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"rotexai/core/api/internal/application"
	"rotexai/core/api/internal/domain"
	"rotexai/core/api/internal/http/middleware"
	"rotexai/core/api/internal/http/response"
)

func decodeJSON(w http.ResponseWriter, r *http.Request, out interface{}) bool {
	if err := json.NewDecoder(r.Body).Decode(out); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid_json", "invalid json body", nil)
		return false
	}
	return true
}

func paginationFromRequest(r *http.Request) application.Pagination {
	q := r.URL.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(q.Get("page_size"))
	if pageSize < 1 {
		pageSize = 20
	}
	return application.Pagination{Page: page, PageSize: pageSize}
}

func scopeAndTenant(w http.ResponseWriter, r *http.Request) (domain.Scope, string, bool) {
	scope := domain.Scope(r.URL.Query().Get("scope"))
	if scope == "" {
		scope = domain.ScopeGlobal
	}
	if scope != domain.ScopeGlobal && scope != domain.ScopeTenant {
		response.Error(w, http.StatusBadRequest, "invalid_scope", "scope must be global or tenant", nil)
		return "", "", false
	}

	principal, _ := middleware.PrincipalFromContext(r.Context())
	if scope == domain.ScopeTenant && principal.TenantID == "" {
		response.Error(w, http.StatusBadRequest, "missing_tenant_header", "Rotexai-Tenant-Id header is required for tenant scope", nil)
		return "", "", false
	}
	return scope, principal.TenantID, true
}
