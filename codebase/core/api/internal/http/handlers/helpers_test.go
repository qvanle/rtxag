package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"rotexai/core/api/internal/domain"
	mid "rotexai/core/api/internal/http/middleware"
)

func TestScopeAndTenantFromHeader(t *testing.T) {
	h := mid.RequireGatewayHeaders(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		scope, tenantID, ok := scopeAndTenant(w, r)
		if !ok {
			t.Fatal("expected scope and tenant")
		}
		if scope != domain.ScopeTenant {
			t.Fatalf("expected tenant scope got %s", scope)
		}
		if tenantID != "t-1" {
			t.Fatalf("expected tenant t-1 got %s", tenantID)
		}
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/admin/assistants?scope=tenant", nil)
	req.Header.Set("Rotexai-User-Roles", "system_admin")
	req.Header.Set("Rotexai-User-Id", "u-1")
	req.Header.Set("Rotexai-Tenant-Id", "t-1")
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200 got %d", rr.Code)
	}
}
