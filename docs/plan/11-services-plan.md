# Services Plan

## Objective
Implement business logic for remaining domains in `core/services` with repository interfaces and predictable error semantics.

## Current State
- `model` and `provider` services + GORM repositories exist.
- Shared error package exists.

## Target State
- Retrieval, MCP, Assistant, Dashboard services implemented.
- Validation and rule enforcement centralized here.

## Work Items
- Add `retrieval` service + repository contracts.
- Add `mcp` service + repository contracts.
- Add `assistant` service with transactional composition checks.
- Add `dashboard` service for metrics read use-cases.
- Normalize domain error behavior across services.

## Dependencies
- ORM models and migrations.
- API adapter contracts.

## Acceptance Criteria
- Every admin domain has service and repository interfaces.
- Business rules are not duplicated in handlers.

## Assumptions
- Services remain package-per-domain.
