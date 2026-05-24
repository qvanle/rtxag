# Database Schema (Core ORM)

## Overview
This schema describes the current SQL-authoritative model in `codebase/core/orm/migrations` for the Core Admin domain.

Implementation choices:
- PostgreSQL
- GORM models in `codebase/core/orm/models`
- SQL migrations as source of truth
- Scope-aware data model (`global` and `tenant`)
- Soft delete for core entities
- JSONB for flexible payloads
- Tenant lifecycle is external; `tenant_id` is stored as reference only (no local tenants table)

## Shared Types
- `scope_type`: `global`, `tenant`
- `entity_status_type`: `draft`, `active`, `deprecated`, `archived`
- `environment_type`: `dev`, `staging`, `prod`
- `index_status_type`: `queued`, `indexing`, `indexed`, `failed`

## Core Tables

### plans
Stores plan quotas and limits.

Key columns:
- `id` (UUID, PK)
- `code` (unique)
- `name`
- `max_users`, `max_agents`
- `rate_limit_rpm`, `rate_limit_tpm`
- `storage_bytes`
- `monthly_token_budget`
- `monthly_cost_budget_cents`
- `created_at`, `updated_at`

### providers
Provider credentials metadata and routing priority.

Key columns:
- `id` (UUID, PK)
- `name`
- `environment` (`environment_type`)
- `priority`
- `api_key_masked`
- `enabled`
- `created_at`, `updated_at`, `deleted_at` (soft delete)

Constraints:
- Unique: `(name, environment)`
- Unique: `(environment, priority)`

### models
Global model registry.

Key columns:
- `id` (UUID, PK)
- `name`
- `provider_id` (FK -> `providers.id`)
- `version`
- `status` (`entity_status_type`)
- `is_system_required` (bool)
- `created_by`, `updated_by`
- `created_at`, `updated_at`, `deleted_at` (soft delete)

Constraints:
- Unique: `(name, version)`

### retrieval_collections
Retrieval collections in global/tenant scope.

Key columns:
- `id` (UUID, PK)
- `scope` (`scope_type`)
- `tenant_id` (external tenant reference, nullable for global)
- `name`
- `embedding_model_id` (FK -> `models.id`)
- `document_count`
- `index_status` (`index_status_type`)
- `created_by`, `updated_by`
- `created_at`, `updated_at`, `deleted_at` (soft delete)

Constraints:
- Scope check:
  - global => `tenant_id IS NULL`
  - tenant => `tenant_id IS NOT NULL`

Unique scoped name is enforced by index:
- `ux_retrieval_collections_scope_name`
- expression: `(scope, COALESCE(tenant_id, ''), name)`

### retrieval_documents
Documents indexed in retrieval collections.

Key columns:
- `id` (UUID, PK)
- `collection_id` (FK -> `retrieval_collections.id`, cascade on delete)
- `filename`
- `content_uri`
- `content_hash`
- `size_bytes`
- `mime_type`
- `status` (`index_status_type`)
- `indexed_at`
- `created_at`, `updated_at`

Constraints:
- Unique: `(collection_id, filename)`

### mcp_collections
MCP collections in global/tenant scope.

Key columns:
- `id` (UUID, PK)
- `scope` (`scope_type`)
- `tenant_id` (external tenant reference, nullable for global)
- `name`
- `record_count`
- `created_by`, `updated_by`
- `created_at`, `updated_at`, `deleted_at` (soft delete)

Constraints:
- Scope check:
  - global => `tenant_id IS NULL`
  - tenant => `tenant_id IS NOT NULL`

Unique scoped name is enforced by index:
- `ux_mcp_collections_scope_name`
- expression: `(scope, COALESCE(tenant_id, ''), name)`

### mcp_records
Records stored inside MCP collections.

Key columns:
- `id` (UUID, PK)
- `collection_id` (FK -> `mcp_collections.id`, cascade on delete)
- `record_key`
- `record_value` (JSONB)
- `created_at`, `updated_at`

Constraints:
- Unique: `(collection_id, record_key)`

### assistants
Assistant definitions (global/tenant scoped).

Key columns:
- `id` (UUID, PK)
- `scope` (`scope_type`)
- `tenant_id` (external tenant reference, nullable for global)
- `name`
- `status` (`entity_status_type`)
- `version`
- `created_by`, `updated_by`
- `created_at`, `updated_at`, `deleted_at` (soft delete)

Constraints:
- Scope check:
  - global => `tenant_id IS NULL`
  - tenant => `tenant_id IS NOT NULL`

Unique assistant version in scope is enforced by index:
- `ux_assistants_scope_name_version`
- expression: `(scope, COALESCE(tenant_id, ''), name, version)`

## Assistant Composition Link Tables

### assistant_models
- `assistant_id` (FK -> `assistants.id`, cascade)
- `model_id` (FK -> `models.id`)
- `created_at`
- PK: `(assistant_id, model_id)`

### assistant_retrieval_collections
- `assistant_id` (FK -> `assistants.id`, cascade)
- `collection_id` (FK -> `retrieval_collections.id`)
- `created_at`
- PK: `(assistant_id, collection_id)`

### assistant_mcp_collections
- `assistant_id` (FK -> `assistants.id`, cascade)
- `collection_id` (FK -> `mcp_collections.id`)
- `created_at`
- PK: `(assistant_id, collection_id)`

## Observability Tables

### api_request_metrics_hourly
Hourly aggregated API metrics.

Key columns:
- `bucket_start`
- `tenant_id` (nullable/global aggregate)
- `endpoint`, `method`
- `request_count`
- `token_consumption`
- `cost_cents`
- `error_count`
- `p95_latency_ms`

PK:
- `(bucket_start, tenant_id, endpoint, method)`

### audit_events
Immutable admin/system action log.

Key columns:
- `id` (UUID, PK)
- `event_type`
- `actor_id`
- `actor_roles` (JSONB)
- `tenant_id` (nullable)
- `target_type`, `target_id`
- `before_snapshot` (JSONB)
- `after_snapshot` (JSONB)
- `ip_address` (INET)
- `request_id`
- `created_at`

## Index Strategy
- `ix_models_status` on `models(status)`
- `ix_retrieval_scope_tenant` on `retrieval_collections(scope, tenant_id)`
- `ix_retrieval_documents_collection` on `retrieval_documents(collection_id)`
- `ux_retrieval_collections_scope_name` unique index on retrieval scoped name
- `ix_mcp_scope_tenant` on `mcp_collections(scope, tenant_id)`
- `ix_mcp_records_collection` on `mcp_records(collection_id)`
- `ux_mcp_collections_scope_name` unique index on MCP scoped name
- `ix_assistants_scope_tenant` on `assistants(scope, tenant_id)`
- `ux_assistants_scope_name_version` unique index on assistant scoped version
- `ix_audit_events_created_at`, `ix_audit_events_actor`, `ix_audit_events_target`

## Counter Synchronization Triggers
Defined in `0002_counter_triggers.sql`:
- `retrieval_documents` INSERT/DELETE updates `retrieval_collections.document_count`
- `mcp_records` INSERT/DELETE updates `mcp_collections.record_count`

## Notes for GORM Implementation
- Use `gorm.DeletedAt` for soft-deleted core entities.
- Use `type:jsonb` tags for JSON payload columns.
- Keep migration SQL authoritative; do not rely only on AutoMigrate in production.
- Do not create a local `tenants` table in this service.
