# Admin API Specification

## Overview
This document defines API endpoints for the System Admin interface described in `docs/interface/admin.md`.

Base path:
- `/api/admin`

Authentication and identity:
- Authentication is handled by API Gateway (out of scope for this service).
- This service trusts gateway-attached headers:
  - `Rotexai-User-Roles` (required)
  - `Rotexai-User-Id` (required)
  - `Rotexai-Tenant-Id` (required only for tenant-scope queries/commands)

Conventions:
- JSON request/response.
- Timestamps in ISO 8601.
- Pagination query: `page`, `page_size`.
- Common response shape:

```json
{
  "data": {},
  "meta": {},
  "error": null
}
```

---

## 1) Dashboard

### GET `/api/admin/dashboard/global`
Get global metrics.

Response `data`:
- `token_consumption`
- `tenant_cost`
- `api_error_rate`
- `p95_latency`
- `traffic_summary`

### GET `/api/admin/dashboard/tenants`
Get per-tenant dashboard rows.

Query:
- `page`, `page_size`
- `plan` (optional)
- `status` (optional)

Response `data[]`:
- `tenant_id`
- `tenant_name`
- `plan`
- `status`
- `users`
- `token_usage`

---

## 2) Models and Providers

## Model Resource
Fields:
- `id`
- `name`
- `provider`
- `version`
- `status` (`draft|active|deprecated|archived`)
- `updated_at`

### GET `/api/admin/models`
List models.

### POST `/api/admin/models`
Create model.

Request:
- `name` (string, required)
- `provider` (string, required)
- `version` (string, required)
- `status` (optional)

### GET `/api/admin/models/{model_id}`
Get model detail.

### PATCH `/api/admin/models/{model_id}`
Update model.

### DELETE `/api/admin/models/{model_id}`
Archive/delete model.

## Provider Resource
Fields:
- `id`
- `name`
- `environment` (`dev|staging|prod`)
- `priority`
- `api_key_masked`
- `enabled`

### GET `/api/admin/providers`
List providers.

### POST `/api/admin/providers`
Create provider config.

### PATCH `/api/admin/providers/{provider_id}`
Update provider config.

### POST `/api/admin/providers/{provider_id}/toggle`
Enable/disable provider.

### POST `/api/admin/providers/reorder`
Update fallback priority order.

Request:
- `provider_ids` (array in desired priority order)

---

## 3) Retrieval Collections

Retrieval uses collections in 2 scopes: `global` and `tenant`.

## Retrieval Collection Resource
Fields:
- `id`
- `scope` (`global|tenant`)
- `tenant_id` (nullable for global)
- `name`
- `embedding_model_id` (must reference Model)
- `document_count`
- `index_status`
- `updated_at`

### GET `/api/admin/retrieval/collections`
List retrieval collections.

Query:
- `scope` (`global|tenant`)
- `Rotexai-Tenant-Id` header required when `scope=tenant`

### POST `/api/admin/retrieval/collections`
Create retrieval collection.

Request:
- `scope` (required)
- tenant scope requires `Rotexai-Tenant-Id` header
- `name` (required)
- `embedding_model_id` (required)

### GET `/api/admin/retrieval/collections/{collection_id}`
Get collection detail.

### PATCH `/api/admin/retrieval/collections/{collection_id}`
Update collection (including `embedding_model_id`).

### DELETE `/api/admin/retrieval/collections/{collection_id}`
Delete collection.

## Retrieval Documents
Fields:
- `id`
- `collection_id`
- `filename`
- `status` (`queued|indexing|indexed|failed`)
- `created_at`

### GET `/api/admin/retrieval/collections/{collection_id}/documents`
List documents in collection.

### POST `/api/admin/retrieval/collections/{collection_id}/documents`
Upload/add document to collection.

### DELETE `/api/admin/retrieval/collections/{collection_id}/documents/{document_id}`
Delete document.

### POST `/api/admin/retrieval/collections/{collection_id}/reindex`
Reindex all documents in collection using selected embedding model.

---

## 4) MCP Collections

MCP uses collections in 2 scopes: `global` and `tenant`.

## MCP Collection Resource
Fields:
- `id`
- `scope` (`global|tenant`)
- `tenant_id` (nullable for global)
- `name`
- `record_count`
- `updated_at`

### GET `/api/admin/mcp/collections`
List MCP collections.

Query:
- `scope` (`global|tenant`)
- `Rotexai-Tenant-Id` header required when `scope=tenant`

### POST `/api/admin/mcp/collections`
Create MCP collection.

### GET `/api/admin/mcp/collections/{collection_id}`
Get MCP collection detail.

### PATCH `/api/admin/mcp/collections/{collection_id}`
Update MCP collection.

### DELETE `/api/admin/mcp/collections/{collection_id}`
Delete MCP collection.

## MCP Records
Fields:
- `id`
- `collection_id`
- `key`
- `value`
- `updated_at`

### GET `/api/admin/mcp/collections/{collection_id}/records`
List records.

### POST `/api/admin/mcp/collections/{collection_id}/records`
Create record.

### PATCH `/api/admin/mcp/collections/{collection_id}/records/{record_id}`
Update record.

### DELETE `/api/admin/mcp/collections/{collection_id}/records/{record_id}`
Delete record.

---

## 5) Assistants

Assistants are composed from Models + Retrieval collections + MCP collections and exist in scopes `global|tenant`.

## Assistant Resource
Fields:
- `id`
- `scope` (`global|tenant`)
- `tenant_id` (nullable for global)
- `name`
- `status` (`draft|active|deprecated|archived`)
- `model_ids` (array)
- `retrieval_collection_ids` (array)
- `mcp_collection_ids` (array)
- `version`
- `updated_at`

### GET `/api/admin/assistants`
List assistants.

Query:
- `scope` (`global|tenant`)
- `Rotexai-Tenant-Id` header required when `scope=tenant`

### POST `/api/admin/assistants`
Create assistant.

Request:
- `scope` (required)
- tenant scope requires `Rotexai-Tenant-Id` header
- `name` (required)
- `model_ids` (required, at least 1)
- `retrieval_collection_ids` (optional)
- `mcp_collection_ids` (optional)

### GET `/api/admin/assistants/{assistant_id}`
Get assistant detail.

### PATCH `/api/admin/assistants/{assistant_id}`
Update assistant composition and metadata.

### DELETE `/api/admin/assistants/{assistant_id}`
Archive/delete assistant.

### POST `/api/admin/assistants/{assistant_id}/activate`
Activate assistant version.

### POST `/api/admin/assistants/{assistant_id}/clone`
Clone assistant to another scope.

Request:
- `target_scope` (`global|tenant`)
- `Rotexai-Tenant-Id` header required when `target_scope=tenant`

---

## 6) Validation Rules
- `embedding_model_id` must reference an existing model.
- Retrieval and MCP collections attached to a tenant assistant must belong to the same tenant.
- Global assistant can only reference global collections unless explicit cross-scope policy is enabled.
- Deleting a model/collection that is in-use by active assistants should be blocked with conflict error.

---

## 7) Error Codes
- `400` invalid request
- `403` forbidden
- `404` not found
- `409` conflict (in-use dependency, duplicate name)
- `422` validation failed
- `500` internal server error
