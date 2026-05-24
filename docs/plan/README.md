# Implementation Plan Index

## Objective
This folder tracks implementation plans for bringing the current codebase to the target backend architecture with clear phase sequencing and executable work items.

## Current Snapshot
- Single Go module at `codebase/core`
- Root command `go run .` defaults to `start` (migrate + run API)
- ORM-backed modules: `Model`, `Provider`
- Stubbed/in-memory modules: `Dashboard`, `Retrieval`, `MCP`, `Assistant`
- Docker stack: Postgres, Qdrant, Admin API, LLMHub

## Plan Structure
- [00-master-plan.md](./00-master-plan.md)
- [01-roadmap-phases.md](./01-roadmap-phases.md)
- [10-api-plan.md](./10-api-plan.md)
- [11-services-plan.md](./11-services-plan.md)
- [12-schemas-plan.md](./12-schemas-plan.md)
- [13-orm-plan.md](./13-orm-plan.md)
- [14-docker-ops-plan.md](./14-docker-ops-plan.md)
- [20-testing-plan.md](./20-testing-plan.md)
- [21-risk-register.md](./21-risk-register.md)
- [22-task-backlog.md](./22-task-backlog.md)

## Recommended Reading Order
1. Master plan
2. Roadmap phases
3. API/Services/Schemas/ORM plans
4. Docker/Ops plan
5. Testing plan
6. Risk register
7. Task backlog

## Status Legend
- `not started`
- `in progress`
- `done`
- `blocked`
