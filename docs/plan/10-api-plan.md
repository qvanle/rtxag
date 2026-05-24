# API Plan

## Objective
Finish API layer wiring so all routes delegate to service layer implementations with consistent error mapping.

## Current State
- Routing and middleware are in place.
- Headers and role checks are implemented.
- Only Model/Provider handlers are connected to ORM-backed services.

## Target State
- All domains delegated to `core/services` adapters.
- Handlers stay thin and transport-focused.

## Work Items
- Add adapters for Retrieval/MCP/Assistant/Dashboard services.
- Replace in-memory dependency injection in bootstrap for remaining modules.
- Standardize status codes for domain errors:
  - invalid input -> 400/422
  - forbidden -> 403
  - not found -> 404
  - conflict -> 409

## Dependencies
- Services implementation files in `core/services`.
- DTO contracts in `core/schemas`.

## Acceptance Criteria
- All `/api/admin/*` routes are wired to services.
- API package has no domain logic duplication.

## Assumptions
- Existing route paths remain stable.
