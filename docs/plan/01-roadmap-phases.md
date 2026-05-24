# Roadmap Phases

## Objective
Sequence implementation into safe, testable phases with explicit entry and exit criteria.

## Phase 1 — Retrieval (`not started`)
### Entry Criteria
- ORM schema + migrations are applied.
- Existing Model/Provider flow is stable.

### Deliverables
- Retrieval service/repository implementation.
- API adapters and handlers wired to ORM-backed retrieval flow.
- Scope and tenant-header enforcement for retrieval operations.

### Exit Criteria
- Retrieval endpoints no longer use in-memory stubs.
- Retrieval unit/integration tests pass.

## Phase 2 — MCP (`not started`)
### Deliverables
- MCP service/repository implementation.
- API wiring for collection + record operations.

### Exit Criteria
- MCP endpoints no longer use in-memory stubs.
- Record/collection consistency validated in tests.

## Phase 3 — Assistant Composition (`not started`)
### Deliverables
- Assistant CRUD + activate + clone backed by ORM.
- Composition validation with transaction boundaries.

### Exit Criteria
- Assistant endpoints no longer stubbed.
- Composition constraints validated with failing/positive tests.

## Phase 4 — Dashboard (`not started`)
### Deliverables
- DB-backed metric read models and aggregation queries.

### Exit Criteria
- Dashboard endpoints no longer stubbed.
- Query behavior validated with fixtures.

## Phase 5 — Hardening (`not started`)
### Deliverables
- End-to-end integration tests.
- Error mapping and performance checks.
- CI quality gates for docs + tests.

### Exit Criteria
- Production-readiness checklist complete.
