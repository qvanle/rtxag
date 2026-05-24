package middleware

import (
	"context"
	"net/http"
	"strings"

	"rotexai/core/api/internal/domain"
	"rotexai/core/api/internal/http/response"
)

type contextKey string

const principalKey contextKey = "principal"

func PrincipalFromContext(ctx context.Context) (domain.Principal, bool) {
	principal, ok := ctx.Value(principalKey).(domain.Principal)
	return principal, ok
}

func RequireGatewayHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		rolesRaw := strings.TrimSpace(r.Header.Get("Rotexai-User-Roles"))
		userID := strings.TrimSpace(r.Header.Get("Rotexai-User-Id"))
		if rolesRaw == "" || userID == "" {
			response.Error(w, http.StatusForbidden, "missing_gateway_headers", "Rotexai-User-Roles and Rotexai-User-Id are required", nil)
			return
		}

		roles := strings.Split(rolesRaw, ",")
		for i, role := range roles {
			roles[i] = strings.TrimSpace(role)
		}

		principal := domain.Principal{
			UserID:   userID,
			Roles:    roles,
			TenantID: strings.TrimSpace(r.Header.Get("Rotexai-Tenant-Id")),
		}
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), principalKey, principal)))
	})
}

func RequireSystemAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		principal, ok := PrincipalFromContext(r.Context())
		if !ok {
			response.Error(w, http.StatusForbidden, "missing_principal", "principal context is required", nil)
			return
		}
		for _, role := range principal.Roles {
			if role == "system_admin" || role == "admin" {
				next.ServeHTTP(w, r)
				return
			}
		}
		response.Error(w, http.StatusForbidden, "forbidden", "system_admin role required", nil)
	})
}
