CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scope_type') THEN
    CREATE TYPE scope_type AS ENUM ('global', 'tenant');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entity_status_type') THEN
    CREATE TYPE entity_status_type AS ENUM ('draft', 'active', 'deprecated', 'archived');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'index_status_type') THEN
    CREATE TYPE index_status_type AS ENUM ('queued', 'indexing', 'indexed', 'failed');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  max_users INTEGER NOT NULL DEFAULT 0,
  max_agents INTEGER NOT NULL DEFAULT 0,
  rate_limit_rpm INTEGER NOT NULL DEFAULT 0,
  rate_limit_tpm INTEGER NOT NULL DEFAULT 0,
  storage_bytes BIGINT NOT NULL DEFAULT 0,
  monthly_token_budget BIGINT NOT NULL DEFAULT 0,
  monthly_cost_budget_cents BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenants (
  id_internal TEXT PRIMARY KEY,
  id_external TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  base_url TEXT,
  credentials_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  credentials_encrypted JSONB,
  resources JSONB NOT NULL DEFAULT '{}'::jsonb,
  icon_svg_url TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_timestamp BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS retrieval_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope scope_type NOT NULL,
  tenant_id TEXT REFERENCES tenants(id_internal),
  name TEXT NOT NULL,
  embedding_model_id TEXT NOT NULL,
  document_count INTEGER NOT NULL DEFAULT 0,
  index_status index_status_type NOT NULL DEFAULT 'queued',
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CHECK ((scope = 'global' AND tenant_id IS NULL) OR (scope = 'tenant' AND tenant_id IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS retrieval_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES retrieval_collections(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  content_uri TEXT,
  content_hash TEXT,
  size_bytes BIGINT,
  mime_type TEXT,
  status index_status_type NOT NULL DEFAULT 'queued',
  indexed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (collection_id, filename)
);

CREATE TABLE IF NOT EXISTS tools_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope scope_type NOT NULL,
  tenant_id TEXT REFERENCES tenants(id_internal),
  name TEXT NOT NULL,
  record_count INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CHECK ((scope = 'global' AND tenant_id IS NULL) OR (scope = 'tenant' AND tenant_id IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS tools_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES tools_collections(id) ON DELETE CASCADE,
  record_key TEXT NOT NULL,
  record_value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (collection_id, record_key)
);

CREATE TABLE IF NOT EXISTS assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope scope_type NOT NULL,
  tenant_id TEXT REFERENCES tenants(id_internal),
  name TEXT NOT NULL,
  status entity_status_type NOT NULL DEFAULT 'draft',
  version TEXT NOT NULL,
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CHECK ((scope = 'global' AND tenant_id IS NULL) OR (scope = 'tenant' AND tenant_id IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS assistant_retrieval_collections (
  assistant_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES retrieval_collections(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (assistant_id, collection_id)
);

CREATE TABLE IF NOT EXISTS assistant_tools_collections (
  assistant_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES tools_collections(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (assistant_id, collection_id)
);

CREATE TABLE IF NOT EXISTS api_request_metrics_hourly (
  bucket_start TIMESTAMPTZ NOT NULL,
  tenant_id TEXT REFERENCES tenants(id_internal),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  request_count BIGINT NOT NULL DEFAULT 0,
  token_consumption BIGINT NOT NULL DEFAULT 0,
  cost_cents BIGINT NOT NULL DEFAULT 0,
  error_count BIGINT NOT NULL DEFAULT 0,
  p95_latency_ms INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket_start, tenant_id, endpoint, method)
);

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_roles JSONB NOT NULL DEFAULT '[]',
  tenant_id TEXT REFERENCES tenants(id_internal),
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  before_snapshot JSONB,
  after_snapshot JSONB,
  ip_address INET,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_providers_enabled ON providers(enabled);
CREATE INDEX IF NOT EXISTS ix_retrieval_scope_tenant ON retrieval_collections(scope, tenant_id);
CREATE INDEX IF NOT EXISTS ix_retrieval_documents_collection ON retrieval_documents(collection_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_retrieval_collections_scope_name ON retrieval_collections(scope, COALESCE(tenant_id, ''), name);
CREATE INDEX IF NOT EXISTS ix_tools_scope_tenant ON tools_collections(scope, tenant_id);
CREATE INDEX IF NOT EXISTS ix_tools_records_collection ON tools_records(collection_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_tools_collections_scope_name ON tools_collections(scope, COALESCE(tenant_id, ''), name);
CREATE INDEX IF NOT EXISTS ix_assistants_scope_tenant ON assistants(scope, tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_assistants_scope_name_version ON assistants(scope, COALESCE(tenant_id, ''), name, version);
CREATE INDEX IF NOT EXISTS ix_audit_events_created_at ON audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS ix_audit_events_actor ON audit_events(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_audit_events_target ON audit_events(target_type, target_id, created_at DESC);
