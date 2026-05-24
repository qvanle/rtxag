# Testing Plan

## Objective
Define testing coverage and gates required to consider backend implementation complete.

## Current State
- Unit-level compile tests run across modules.
- Middleware tests exist in API.
- Limited domain integration coverage.

## Target State
- Unit + integration tests across all admin domains.
- Docker smoke checks documented and repeatable.

## Work Items
- Add service unit tests:
  - Retrieval
  - MCP
  - Assistant
  - Dashboard
- Add ORM repository integration tests against Postgres test DB.
- Add API integration tests for route behavior and error mapping.
- Add compose smoke checks:
  - container startup
  - health endpoints
  - migration success

## Dependencies
- Fully wired services and repositories.
- Stable Docker stack.

## Acceptance Criteria
- `go test ./...` passes with new domain tests.
- Integration test suite validates key paths and edge cases.

## Assumptions
- Integration tests can run against disposable Postgres containers.
