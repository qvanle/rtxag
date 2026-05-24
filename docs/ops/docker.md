# Docker Operations

## Compose Stack
Compose file: `docker/docker-compose.yml`
Env file: `docker/.env`

Services:
- `rtxag-postgres` (from `codebase/database/postgres/Dockerfile`)
- `rtxag-qdrant` (from `codebase/database/qdrant/Dockerfile`)
- `rtxag-adminapi` (from `codebase/core/Dockerfile`)
- `rtxag-llmhub` (from `codebase/llmhub/docker/Dockerfile`)

## Runtime Data Mounts
- Postgres: `~/rotexai-runtime/rtxag/postgres`
- Qdrant: `~/rotexai-runtime/rtxag/qdrant`

## Launch
From repository root:

```bash
docker compose -f docker/docker-compose.yml --env-file docker/.env up --build
```

Detached mode:

```bash
docker compose -f docker/docker-compose.yml --env-file docker/.env up --build -d
```

Stop:

```bash
docker compose -f docker/docker-compose.yml --env-file docker/.env down
```

Stop and remove data volumes:

```bash
docker compose -f docker/docker-compose.yml --env-file docker/.env down -v
```

## Troubleshooting
Check container status:

```bash
docker ps -a
```

Tail logs:

```bash
docker logs rtxag-adminapi --tail 200
docker logs rtxag-llmhub --tail 200
docker logs rtxag-postgres --tail 200
docker logs rtxag-qdrant --tail 200
```

## Known Runtime Requirements
### LLMHub AES Key
`LLMHUB_AES_ENCRYPTION_KEY` must be a valid hex string (not plain text).

If invalid, `rtxag-llmhub` fails at startup with `bytes.fromhex()` errors.
