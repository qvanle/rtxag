# RotexAI v2.0.0

Monorepo for RotexAI core services and admin interface.

## Repository Structure
- `codebase/core/api`: Go Admin API service
- `codebase/core/orm`: Go ORM models and migration runner
- `codebase/interface/admin`: Admin web interface (TanStack + Vite)
- `docs`: Product, API, and schema documentation
- `docker`: Container-related assets

## Prerequisites
- Go (for `core/api` and `core/orm`)
- PostgreSQL
- Node.js and pnpm or bun (for `interface/admin`)

## Quick Start

### 1) Run DB migrations
```bash
cd codebase/core/orm
export ROTEXAI_ORM_DSN='postgres://user:pass@localhost:5432/rotexai?sslmode=disable'
go run ./cmd/orm-migrate
```

### 2) Run Admin API
```bash
cd codebase/core/api
export ADMIN_API_DB_DSN='postgres://user:pass@localhost:5432/rotexai?sslmode=disable'
go run ./cmd/adminapi
```

Required request headers:
- `Rotexai-User-Roles`
- `Rotexai-User-Id`
- `Rotexai-Tenant-Id` (for tenant-scope operations)

### 3) Run Admin Interface
```bash
cd codebase/interface/admin
pnpm install
pnpm dev
```

Alternative with bun:
```bash
bun install
bun run dev
```

## Documentation
- API contract: `codebase/core/api/openapi/admin.yaml`
- API guide: `docs/api/admin.md`
- Database schema: `docs/database/schema.md`
- Feature docs: `docs/features/*`
- Interface notes: `docs/interface/admin.md`

## License
This project is licensed under the terms in `LICENSE`.
