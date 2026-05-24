# Docker and Operations Plan

## Objective
Keep local/dev runtime reproducible and diagnosable across core services.

## Current State
- Compose stack includes Postgres, Qdrant, Admin API, LLMHub.
- Data bind mounts use `~/rotexai-runtime/rtxag/{postgres,qdrant}`.

## Target State
- Compose startup is deterministic and documented.
- Environment requirements are explicit (including LLMHub AES hex key).

## Work Items
- Keep compose service definitions synchronized with code paths.
- Maintain `.env` contract documentation.
- Add smoke validation checklist to ops docs.

## Dependencies
- `docker/docker-compose.yml`
- `docker/.env`

## Acceptance Criteria
- `docker compose ... up --build` results in healthy/running containers.
- Ops docs match actual service names and ports.

## Assumptions
- LLMHub remains an external Python service in this stack.
