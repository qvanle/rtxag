import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type Scope = "global" | "tenant";
export type Status = "active" | "draft" | "deprecated" | "archived";

type Envelope<T> = {
  data: T;
  meta: unknown;
  error: { code: string; message: string; details?: unknown } | null;
};

export type DashboardGlobal = {
  token_consumption: string;
  tenant_cost: string;
  api_error_rate: string;
  p95_latency: string;
  traffic_summary: string;
};

export type DashboardTenantRow = {
  tenant_id: string;
  tenant_name: string;
  plan: string;
  status: string;
  users: number;
  token_usage: string;
};

export type Tenant = {
  id_internal: string;
  id_external: string;
  name: string;
};

export type Provider = {
  id: string;
  provider_id: string;
  name: string;
  description: string;
  base_url?: string;
  api_key_masked?: string;
  resources?: string;
  icon_svg_url?: string;
  enabled: boolean;
  updated_timestamp?: number;
  updated_at: string;
};

export type RetrievalCollection = {
  id: string;
  scope: Scope;
  tenant_id?: string | null;
  name: string;
  provider_id: string;
  document_count: number;
  index_status: string;
  updated_at: string;
};

export type RetrievalDocument = {
  id: string;
  collection_id: string;
  filename: string;
  status: string;
  created_at: string;
};

export type ToolCollection = {
  id: string;
  scope: Scope;
  tenant_id?: string | null;
  name: string;
  record_count: number;
  updated_at: string;
};

export type ToolRecord = {
  id: string;
  collection_id: string;
  key: string;
  value: string;
  updated_at: string;
};

export type Assistant = {
  id: string;
  scope: Scope;
  tenant_id?: string | null;
  name: string;
  status: Status;
  provider_id: string;
  retrieval_collection_ids: string[];
  tools_collection_ids: string[];
  version: string;
  updated_at: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/admin${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  let envelope: Envelope<T> | null = null;
  try {
    envelope = (await response.json()) as Envelope<T>;
  } catch {
    throw new Error(`Request failed with status ${response.status}`);
  }

  if (!response.ok || envelope.error) {
    throw new Error(envelope.error?.message ?? `Request failed with status ${response.status}`);
  }

  return envelope.data;
}

function q(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") search.set(k, String(v));
  }
  const result = search.toString();
  return result ? `?${result}` : "";
}

export const adminApi = {
  dashboardGlobal: () => request<DashboardGlobal>("/dashboard/global"),
  dashboardTenants: (plan?: string, status?: string) =>
    request<DashboardTenantRow[]>(`/dashboard/tenants${q({ page: 1, page_size: 100, plan, status })}`),
  listTenants: () => request<Tenant[]>(`/tenants${q({ page: 1, page_size: 100 })}`),
  createTenant: (body: { id_internal: string; id_external: string; name: string }) =>
    request<Tenant>("/tenants", { method: "POST", body: JSON.stringify(body) }),
  updateTenant: (idInternal: string, body: { id_external?: string; name?: string }) =>
    request<Tenant>(`/tenants/${idInternal}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteTenant: (idInternal: string) =>
    request<{ ok: boolean }>(`/tenants/${idInternal}`, { method: "DELETE" }),

  listProviders: () => request<Provider[]>("/providers"),
  createProvider: (body: { provider_id: string; name: string; description: string; base_url?: string; api_key?: string; resources?: string; icon_svg_url?: string; enabled: boolean; updated_timestamp?: number }) =>
    request<Provider>("/providers", { method: "POST", body: JSON.stringify(body) }),
  updateProvider: (id: string, body: { provider_id: string; name: string; description: string; base_url?: string; api_key?: string; resources?: string; icon_svg_url?: string; enabled: boolean; updated_timestamp?: number }) =>
    request<Provider>(`/providers/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteProvider: (id: string) =>
    request<{ ok: boolean }>(`/providers/${id}`, { method: "DELETE" }),

  listRetrievalCollections: (scope: Scope) =>
    request<RetrievalCollection[]>(`/retrieval/collections${q({ scope })}`),
  listRetrievalCollectionsByTenant: (tenantId: string) =>
    request<RetrievalCollection[]>(`/retrieval/collections${q({ scope: "tenant" })}`, {
      headers: { "Rotexai-Tenant-Id": tenantId },
    }),
  createRetrievalCollection: (body: { scope: Scope; name: string; provider_id: string; tenant_id?: string }) =>
    request<RetrievalCollection>("/retrieval/collections", { method: "POST", body: JSON.stringify(body) }),
  updateRetrievalCollection: (id: string, body: { name?: string; provider_id?: string }) =>
    request<RetrievalCollection>(`/retrieval/collections/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteRetrievalCollection: (id: string) =>
    request<{ ok: boolean }>(`/retrieval/collections/${id}`, { method: "DELETE" }),
  listRetrievalDocuments: (collectionId: string) =>
    request<RetrievalDocument[]>(`/retrieval/collections/${collectionId}/documents`),
  createRetrievalDocument: (collectionId: string, filename: string) =>
    request<RetrievalDocument>(`/retrieval/collections/${collectionId}/documents`, {
      method: "POST",
      body: JSON.stringify({ filename }),
    }),
  deleteRetrievalDocument: (collectionId: string, documentId: string) =>
    request<{ ok: boolean }>(`/retrieval/collections/${collectionId}/documents/${documentId}`, {
      method: "DELETE",
    }),
  reindexRetrievalCollection: (id: string) =>
    request<{ ok: boolean }>(`/retrieval/collections/${id}/reindex`, { method: "POST" }),

  listToolCollections: (scope: Scope) => request<ToolCollection[]>(`/tools/collections${q({ scope })}`),
  listToolCollectionsByTenant: (tenantId: string) =>
    request<ToolCollection[]>(`/tools/collections${q({ scope: "tenant" })}`, {
      headers: { "Rotexai-Tenant-Id": tenantId },
    }),
  createToolCollection: (body: { scope: Scope; name: string; tenant_id?: string }) =>
    request<ToolCollection>("/tools/collections", { method: "POST", body: JSON.stringify(body) }),
  updateToolCollection: (id: string, body: { name?: string }) =>
    request<ToolCollection>(`/tools/collections/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteToolCollection: (id: string) => request<{ ok: boolean }>(`/tools/collections/${id}`, { method: "DELETE" }),
  listToolRecords: (collectionId: string) =>
    request<ToolRecord[]>(`/tools/collections/${collectionId}/records`),
  createToolRecord: (collectionId: string, body: { key: string; value: string }) =>
    request<ToolRecord>(`/tools/collections/${collectionId}/records`, { method: "POST", body: JSON.stringify(body) }),
  updateToolRecord: (collectionId: string, recordId: string, body: { key?: string; value?: string }) =>
    request<ToolRecord>(`/tools/collections/${collectionId}/records/${recordId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteToolRecord: (collectionId: string, recordId: string) =>
    request<{ ok: boolean }>(`/tools/collections/${collectionId}/records/${recordId}`, { method: "DELETE" }),

  listAssistants: (scope: Scope) => request<Assistant[]>(`/assistants${q({ scope })}`),
  listAssistantsByTenant: (tenantId: string) =>
    request<Assistant[]>(`/assistants${q({ scope: "tenant" })}`, {
      headers: { "Rotexai-Tenant-Id": tenantId },
    }),
  createAssistant: (body: {
    scope: Scope;
    tenant_id?: string;
    name: string;
    provider_id: string;
    retrieval_collection_ids?: string[];
    tools_collection_ids?: string[];
  }) => request<Assistant>("/assistants", { method: "POST", body: JSON.stringify(body) }),
  updateAssistant: (id: string, body: {
    name?: string;
    provider_id?: string;
    retrieval_collection_ids?: string[];
    tools_collection_ids?: string[];
  }) => request<Assistant>(`/assistants/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteAssistant: (id: string) => request<{ ok: boolean }>(`/assistants/${id}`, { method: "DELETE" }),
  activateAssistant: (id: string) => request<{ ok: boolean }>(`/assistants/${id}/activate`, { method: "POST" }),
  cloneAssistant: (id: string, body: { target_scope: Scope }) =>
    request<Assistant>(`/assistants/${id}/clone`, { method: "POST", body: JSON.stringify(body) }),
};

export function useInvalidateAdmin() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["admin"] });
}

export function useAdminQuery<T>(key: (string | number)[], queryFn: () => Promise<T>) {
  return useQuery({ queryKey: ["admin", ...key], queryFn });
}

export function useAdminMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
) {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn,
    onSuccess: () => invalidate(),
  });
}

export function formatDate(isoLike: string) {
  if (!isoLike) return "-";
  const value = new Date(isoLike);
  if (Number.isNaN(value.getTime())) return isoLike;
  return value.toISOString().slice(0, 10);
}
