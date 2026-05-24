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

export type Model = {
  id: string;
  name: string;
  provider: string;
  version: string;
  status: Status;
  updated_at: string;
};

export type Provider = {
  id: string;
  name: string;
  environment: string;
  priority: number;
  api_key_masked: string;
  enabled: boolean;
  updated_at: string;
};

export type RetrievalCollection = {
  id: string;
  scope: Scope;
  tenant_id?: string | null;
  name: string;
  embedding_model_id: string;
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

export type MCPCollection = {
  id: string;
  scope: Scope;
  tenant_id?: string | null;
  name: string;
  record_count: number;
  updated_at: string;
};

export type MCPRecord = {
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
  model_ids: string[];
  retrieval_collection_ids: string[];
  mcp_collection_ids: string[];
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

  listModels: () => request<Model[]>("/models"),
  createModel: (body: { name: string; provider: string; version: string; status: Status }) =>
    request<Model>("/models", { method: "POST", body: JSON.stringify(body) }),
  updateModel: (id: string, body: { name: string; provider: string; version: string; status: Status }) =>
    request<Model>(`/models/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteModel: (id: string) => request<{ ok: boolean }>(`/models/${id}`, { method: "DELETE" }),

  listProviders: () => request<Provider[]>("/providers"),
  createProvider: (body: { name: string; environment: string; priority: number; api_key: string; enabled: boolean }) =>
    request<Provider>("/providers", { method: "POST", body: JSON.stringify(body) }),
  updateProvider: (id: string, body: { name: string; environment: string; priority: number; api_key: string; enabled: boolean }) =>
    request<Provider>(`/providers/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  toggleProvider: (id: string) => request<Provider>(`/providers/${id}/toggle`, { method: "POST" }),
  reorderProviders: (provider_ids: string[]) =>
    request<{ ok: boolean }>("/providers/reorder", { method: "POST", body: JSON.stringify({ provider_ids }) }),

  listRetrievalCollections: (scope: Scope) =>
    request<RetrievalCollection[]>(`/retrieval/collections${q({ scope })}`),
  createRetrievalCollection: (body: { scope: Scope; name: string; embedding_model_id: string }) =>
    request<RetrievalCollection>("/retrieval/collections", { method: "POST", body: JSON.stringify(body) }),
  updateRetrievalCollection: (id: string, body: { name?: string; embedding_model_id?: string }) =>
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

  listMCPCollections: (scope: Scope) => request<MCPCollection[]>(`/mcp/collections${q({ scope })}`),
  createMCPCollection: (body: { scope: Scope; name: string }) =>
    request<MCPCollection>("/mcp/collections", { method: "POST", body: JSON.stringify(body) }),
  updateMCPCollection: (id: string, body: { name?: string }) =>
    request<MCPCollection>(`/mcp/collections/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteMCPCollection: (id: string) => request<{ ok: boolean }>(`/mcp/collections/${id}`, { method: "DELETE" }),
  listMCPRecords: (collectionId: string) =>
    request<MCPRecord[]>(`/mcp/collections/${collectionId}/records`),
  createMCPRecord: (collectionId: string, body: { key: string; value: string }) =>
    request<MCPRecord>(`/mcp/collections/${collectionId}/records`, { method: "POST", body: JSON.stringify(body) }),
  updateMCPRecord: (collectionId: string, recordId: string, body: { key?: string; value?: string }) =>
    request<MCPRecord>(`/mcp/collections/${collectionId}/records/${recordId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteMCPRecord: (collectionId: string, recordId: string) =>
    request<{ ok: boolean }>(`/mcp/collections/${collectionId}/records/${recordId}`, { method: "DELETE" }),

  listAssistants: (scope: Scope) => request<Assistant[]>(`/assistants${q({ scope })}`),
  createAssistant: (body: {
    scope: Scope;
    name: string;
    model_ids: string[];
    retrieval_collection_ids?: string[];
    mcp_collection_ids?: string[];
  }) => request<Assistant>("/assistants", { method: "POST", body: JSON.stringify(body) }),
  updateAssistant: (id: string, body: {
    name?: string;
    model_ids?: string[];
    retrieval_collection_ids?: string[];
    mcp_collection_ids?: string[];
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
