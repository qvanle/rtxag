# Master Plan

## Objective
Complete the Admin backend so all planned modules are ORM-backed, validated, tested, and operable in Docker.

## Current State
- `Model` and `Provider` are implemented through `api -> services -> orm`.
- `Dashboard`, `Retrieval`, `MCP`, `Assistant` remain stubbed in API in-memory layer.
- ORM migrations and GORM models exist and run at startup.

## Target State
- All admin module routes are backed by service+ORM repositories.
- Scope and tenant behavior is fully enforced in service/repo layer.
- Integration tests validate behavior end-to-end.
- Docker stack is stable for local/dev environments.

## Work Items
- Implement Retrieval domain end-to-end.
- Implement MCP domain end-to-end.
- Implement Assistant composition with transactional constraints.
- Replace Dashboard stubs with DB-backed metric reads.
- Add integration test suite and CI gates.

## Dependencies
- Existing schema and migrations in `core/orm/migrations`.
- Current service architecture in `core/services`.
- API contract in `docs/api/admin.md`.

## Acceptance Criteria
- No in-memory stub remains for admin domains.
- `go test ./...` passes for core with domain + integration tests.
- Dockerized stack starts cleanly and passes smoke checks.

## Assumptions
- PostgreSQL remains primary relational store.
- Tenant lifecycle ownership remains external.
