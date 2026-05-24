# RotexAI Core Admin API (Go)

## Stack
- Go + chi/net/http
- GORM + Postgres
- OpenAPI-first contract in `openapi/admin.yaml`

## Required Headers
- `Rotexai-User-Roles`
- `Rotexai-User-Id`
- `Rotexai-Tenant-Id` for tenant-scope operations

## Run
```bash
export ADMIN_API_DB_DSN='postgres://user:pass@localhost:5432/rotexai?sslmode=disable'
go run .
```

## Notes
- Current service wiring uses in-memory application services for endpoint behavior.
- DB bootstrap and SQL migrations are included for next phase repository implementation.
