# Schemas Plan

## Objective
Expand `core/schemas` DTO coverage so all domain requests/responses are typed and reusable.

## Current State
- `common`, `model`, `provider` schema packages exist.

## Target State
- Full DTO packages for `retrieval`, `mcp`, `assistant`, `dashboard`.
- Shared enum usage across packages.

## Work Items
- Create new schema packages:
  - `schemas/retrieval`
  - `schemas/mcp`
  - `schemas/assistant`
  - `schemas/dashboard`
- Add request/response models matching `docs/api/admin.md`.
- Keep schema layer transport-only (no GORM tags).

## Dependencies
- API contract definitions.
- Service method signatures.

## Acceptance Criteria
- All service interfaces consume/return schema DTO types.
- No direct ORM model exposure in API layer.

## Assumptions
- Current `common` enums remain source-of-truth for DTO statuses/scopes.
