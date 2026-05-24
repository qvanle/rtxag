package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRequireGatewayHeaders(t *testing.T) {
	h := RequireGatewayHeaders(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	t.Run("missing headers", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)
		if rr.Code != http.StatusForbidden {
			t.Fatalf("expected %d got %d", http.StatusForbidden, rr.Code)
		}
	})

	t.Run("valid headers", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Set("Rotexai-User-Roles", "system_admin")
		req.Header.Set("Rotexai-User-Id", "u-1")
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected %d got %d", http.StatusOK, rr.Code)
		}
	})
}

func TestRequireSystemAdmin(t *testing.T) {
	h := RequireGatewayHeaders(RequireSystemAdmin(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Rotexai-User-Roles", "viewer")
	req.Header.Set("Rotexai-User-Id", "u-1")
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected %d got %d", http.StatusForbidden, rr.Code)
	}
}
