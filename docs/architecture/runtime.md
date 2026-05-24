# Core Runtime Architecture

## Overview
`codebase/core` is a single Go application module (`codebase/core/go.mod`) with multiple packages and entrypoints.

Main execution flow:
- `cmd` / root entry
- `api` transport layer
- `services` business layer
- `orm` persistence layer
- PostgreSQL storage

## Module Structure
- `core/main.go`: root dispatcher command
- `core/cmd/adminapi`: direct admin API entrypoint
- `core/cmd/orm-migrate`: direct migration entrypoint
- `core/api`: HTTP API layer (routes, middleware, handlers)
- `core/services`: business logic and repository contracts
- `core/schemas`: DTO/contract types
- `core/orm`: GORM models, SQL migrations, DB migration runner

## Entrypoints
Root command (recommended):
- `go run .`
  - default action is `start`
  - `start` runs migrations first, then starts admin API

Explicit commands:
- `go run . adminapi`
- `go run . orm-migrate`

## Package Communication
Current communication is in-process via direct imports and function calls:
- API handlers call interfaces in `api/internal/application`
- Application adapters delegate to `core/services`
- Services use ORM repositories and GORM models from `core/orm`

## Implementation Status
- ORM-backed service path: `Model`, `Provider`
- In-memory/stub path (temporary): `Dashboard`, `Retrieval`, `MCP`, `Assistant`

## Gateway Headers
API trusts gateway-attached identity/scope headers:
- `Rotexai-User-Roles`
- `Rotexai-User-Id`
- `Rotexai-Tenant-Id` (required for tenant-scope operations)
