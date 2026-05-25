import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActionButton,
  DataTable,
  GlassCard,
  PageHeader,
} from "@/components/admin/primitives";
import { cn } from "@/lib/utils";
import { ChevronRight, Plug, Plus } from "lucide-react";
import { adminApi, formatDate, useAdminMutation, useAdminQuery } from "@/lib/admin-api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/tools")({
  component: ToolsPage,
});

type DescriptorForm = {
  key: string;
  description: string;
  method: string;
  url: string;
  headers: string;
  parameters: string;
  timeout_ms: string;
};

type DescriptorPreview = {
  description?: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  parameters?: Record<string, unknown>;
  timeout_ms?: number;
};

const emptyDescriptorForm = (): DescriptorForm => ({
  key: "",
  description: "",
  method: "GET",
  url: "",
  headers: "{\n  \n}",
  parameters: "{\n  \"type\": \"object\",\n  \"properties\": {},\n  \"required\": []\n}",
  timeout_ms: "",
});

function parseDescriptor(raw: string): DescriptorPreview | null {
  try {
    const parsed = JSON.parse(raw) as DescriptorPreview;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function descriptorToForm(record: { key: string; value: string }): DescriptorForm {
  const parsed = parseDescriptor(record.value);
  return {
    key: record.key,
    description: parsed?.description ?? "",
    method: parsed?.method ?? "GET",
    url: parsed?.url ?? "",
    headers: parsed?.headers ? JSON.stringify(parsed.headers, null, 2) : "{\n  \n}",
    parameters: parsed?.parameters ? JSON.stringify(parsed.parameters, null, 2) : "{\n  \"type\": \"object\",\n  \"properties\": {},\n  \"required\": []\n}",
    timeout_ms: typeof parsed?.timeout_ms === "number" ? String(parsed.timeout_ms) : "",
  };
}

function buildDescriptor(form: DescriptorForm) {
  const key = form.key.trim();
  const method = form.method.trim().toUpperCase() || "GET";
  const url = form.url.trim();
  if (!key) {
    throw new Error("Tool name is required");
  }
  if (!url) {
    throw new Error("Tool URL is required");
  }

  let headers: Record<string, string> | undefined;
  const headersText = form.headers.trim();
  if (headersText) {
    const parsed = JSON.parse(headersText);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Headers must be a JSON object");
    }
    headers = Object.fromEntries(
      Object.entries(parsed).map(([headerKey, headerValue]) => [String(headerKey), String(headerValue)]),
    );
  }

  let parameters: Record<string, unknown> | undefined;
  const parametersText = form.parameters.trim();
  if (parametersText) {
    const parsed = JSON.parse(parametersText);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Parameters must be a JSON object");
    }
    parameters = parsed as Record<string, unknown>;
  }

  const timeoutMs = form.timeout_ms.trim();
  const timeoutValue = timeoutMs ? Number(timeoutMs) : undefined;
  if (timeoutMs && (!Number.isFinite(timeoutValue) || timeoutValue < 0)) {
    throw new Error("Timeout must be a non-negative number");
  }

  const descriptor: DescriptorPreview = {
    method,
    url,
  };
  if (form.description.trim()) descriptor.description = form.description.trim();
  if (headers && Object.keys(headers).length > 0) descriptor.headers = headers;
  if (parameters && Object.keys(parameters).length > 0) descriptor.parameters = parameters;
  if (timeoutValue !== undefined && timeoutValue > 0) descriptor.timeout_ms = timeoutValue;

  return {
    key,
    value: JSON.stringify(descriptor, null, 2),
  };
}

function summarizeDescriptor(value: string) {
  const parsed = parseDescriptor(value);
  if (!parsed) {
    return {
      headline: "Invalid descriptor",
      subline: "Open the record editor to fix the JSON payload.",
      raw: value,
    };
  }

  return {
    headline: `${(parsed.method ?? "GET").toUpperCase()} ${parsed.url}`,
    subline: parsed.description || "No description provided.",
    raw: JSON.stringify(parsed, null, 2),
  };
}

function ToolsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createScope, setCreateScope] = useState<"global" | "tenant">("global");
  const [createName, setCreateName] = useState("");
  const [createTenantID, setCreateTenantID] = useState("");

  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [recordMode, setRecordMode] = useState<"create" | "edit">("create");
  const [activeRecordId, setActiveRecordId] = useState("");
  const [recordForm, setRecordForm] = useState<DescriptorForm>(emptyDescriptorForm());
  const [recordError, setRecordError] = useState("");

  const tenantsQuery = useAdminQuery(["tools", "tenants"], adminApi.listTenants);
  const collectionsQuery = useAdminQuery(["tools", "collections", "merged"], async () => {
    const globalCollections = await adminApi.listToolCollections("global");
    const tenants = await adminApi.listTenants();
    const tenantCollections = await Promise.all(
      tenants.map(async (tenant) => ({
        collections: await adminApi.listToolCollectionsByTenant(tenant.id_internal),
      })),
    );
    return [...globalCollections, ...tenantCollections.flatMap((group) => group.collections)];
  });
  const collections = useMemo(() => (collectionsQuery.data as any[]) ?? [], [collectionsQuery.data]);

  const [selectedId, setSelectedId] = useState<string>("");
  useEffect(() => {
    if (!collections.length) {
      setSelectedId("");
      return;
    }
    if (!collections.some((collection) => collection.id === selectedId)) {
      setSelectedId(collections[0].id);
    }
  }, [collections, selectedId]);

  const selected = useMemo(
    () => collections.find((collection) => collection.id === selectedId) ?? collections[0],
    [collections, selectedId],
  );

  const recordsQuery = useAdminQuery(["tools", "records", selected?.id ?? "none"], () =>
    selected ? adminApi.listToolRecords(selected.id) : Promise.resolve([]),
  );
  const records = recordsQuery.data ?? [];

  const createCollection = useAdminMutation(adminApi.createToolCollection);
  const updateCollection = useAdminMutation(({ id, body }: { id: string; body: any }) =>
    adminApi.updateToolCollection(id, body),
  );
  const deleteCollection = useAdminMutation((id: string) => adminApi.deleteToolCollection(id));
  const createRecord = useAdminMutation(
    ({ collectionId, body }: { collectionId: string; body: { key: string; value: string } }) =>
      adminApi.createToolRecord(collectionId, body),
  );
  const updateRecord = useAdminMutation(
    ({ collectionId, recordId, body }: { collectionId: string; recordId: string; body: { key?: string; value?: string } }) =>
      adminApi.updateToolRecord(collectionId, recordId, body),
  );
  const deleteRecord = useAdminMutation(
    ({ collectionId, recordId }: { collectionId: string; recordId: string }) =>
      adminApi.deleteToolRecord(collectionId, recordId),
  );

  const onCreateCollection = () => {
    const name = createName.trim();
    if (!name) {
      window.alert("Collection name is required");
      return;
    }
    if (createScope === "tenant" && !createTenantID) {
      window.alert("Tenant is required for tenant collections");
      return;
    }
    createCollection.mutate(
      {
        scope: createScope,
        tenant_id: createScope === "tenant" ? createTenantID : undefined,
        name,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setCreateName("");
          setCreateTenantID("");
          setCreateScope("global");
        },
      },
    );
  };

  const openCreateRecord = () => {
    setRecordMode("create");
    setActiveRecordId("");
    setRecordForm(emptyDescriptorForm());
    setRecordError("");
    setRecordDialogOpen(true);
  };

  const openEditRecord = (record: { id: string; key: string; value: string }) => {
    setRecordMode("edit");
    setActiveRecordId(record.id);
    setRecordForm(descriptorToForm(record));
    setRecordError("");
    setRecordDialogOpen(true);
  };

  const saveRecord = () => {
    if (!selected) return;
    try {
      const body = buildDescriptor(recordForm);
      if (recordMode === "create") {
        createRecord.mutate(
          { collectionId: selected.id, body },
          {
            onSuccess: () => {
              setRecordDialogOpen(false);
              setRecordForm(emptyDescriptorForm());
            },
          },
        );
      } else {
        updateRecord.mutate(
          { collectionId: selected.id, recordId: activeRecordId, body },
          {
            onSuccess: () => {
              setRecordDialogOpen(false);
              setRecordForm(emptyDescriptorForm());
            },
          },
        );
      }
      setRecordError("");
    } catch (err) {
      setRecordError(err instanceof Error ? err.message : "Failed to save record");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tools"
        description="Tool collections group REST endpoints that assistants can call at runtime."
        actions={
          <ActionButton onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New Collection
          </ActionButton>
        }
      />

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="glass border-glass-border bg-gradient-to-b from-background to-muted/30 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>New Tool Collection</DialogTitle>
            <DialogDescription>Create a collection for REST tools exposed to assistants.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <select
              className="h-10 rounded-md border border-glass-border bg-background px-3 text-sm"
              value={createScope}
              onChange={(e) => setCreateScope(e.target.value as "global" | "tenant")}
            >
              <option value="global">Global</option>
              <option value="tenant">Per tenant</option>
            </select>
            <select
              className="h-10 rounded-md border border-glass-border bg-background px-3 text-sm"
              value={createTenantID}
              onChange={(e) => setCreateTenantID(e.target.value)}
              disabled={createScope !== "tenant"}
            >
              <option value="">Select tenant</option>
              {(tenantsQuery.data ?? []).map((tenant) => (
                <option key={tenant.id_internal} value={tenant.id_internal}>
                  {tenant.name}
                </option>
              ))}
            </select>
            <input
              className="h-10 rounded-md border border-glass-border bg-transparent px-3 text-sm"
              placeholder="Collection name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <ActionButton variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </ActionButton>
            <ActionButton onClick={onCreateCollection} disabled={createCollection.isPending}>
              Create Collection
            </ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="glass border-glass-border bg-gradient-to-b from-background to-muted/30 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{recordMode === "create" ? "New Tool" : "Edit Tool"}</DialogTitle>
            <DialogDescription>
              Define a REST endpoint that the assistant can call during a chat.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <input
              className="h-10 rounded-md border border-glass-border bg-transparent px-3 text-sm"
              placeholder="Tool name"
              value={recordForm.key}
              onChange={(e) => setRecordForm((value) => ({ ...value, key: e.target.value }))}
            />
            <input
              className="h-10 rounded-md border border-glass-border bg-transparent px-3 text-sm"
              placeholder="Description"
              value={recordForm.description}
              onChange={(e) => setRecordForm((value) => ({ ...value, description: e.target.value }))}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px,1fr]">
              <select
                className="h-10 rounded-md border border-glass-border bg-background px-3 text-sm"
                value={recordForm.method}
                onChange={(e) => setRecordForm((value) => ({ ...value, method: e.target.value }))}
              >
                {["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"].map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
              <input
                className="h-10 rounded-md border border-glass-border bg-transparent px-3 text-sm"
                placeholder="https://api.example.com/v1/orders"
                value={recordForm.url}
                onChange={(e) => setRecordForm((value) => ({ ...value, url: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="space-y-2">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Headers JSON</div>
                <textarea
                  className="min-h-40 w-full rounded-xl border border-glass-border bg-transparent px-3 py-2 font-mono text-xs outline-none transition-shadow focus-visible:ring-0 focus-visible:shadow-[0_0_0_3px_rgba(120,160,255,0.2)]"
                  value={recordForm.headers}
                  onChange={(e) => setRecordForm((value) => ({ ...value, headers: e.target.value }))}
                />
              </label>
              <label className="space-y-2">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Parameters JSON</div>
                <textarea
                  className="min-h-40 w-full rounded-xl border border-glass-border bg-transparent px-3 py-2 font-mono text-xs outline-none transition-shadow focus-visible:ring-0 focus-visible:shadow-[0_0_0_3px_rgba(120,160,255,0.2)]"
                  value={recordForm.parameters}
                  onChange={(e) => setRecordForm((value) => ({ ...value, parameters: e.target.value }))}
                />
              </label>
            </div>
            <input
              className="h-10 rounded-md border border-glass-border bg-transparent px-3 text-sm"
              placeholder="Timeout ms"
              value={recordForm.timeout_ms}
              onChange={(e) => setRecordForm((value) => ({ ...value, timeout_ms: e.target.value }))}
            />
            {recordError && <div className="text-sm text-destructive">{recordError}</div>}
          </div>
          <DialogFooter>
            <ActionButton variant="ghost" onClick={() => setRecordDialogOpen(false)}>
              Cancel
            </ActionButton>
            <ActionButton onClick={saveRecord}>
              {recordMode === "create" ? "Create Tool" : "Save Tool"}
            </ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px,1fr]">
        <GlassCard className="overflow-hidden p-0">
          <div className="border-b border-glass-border px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">
            Collections
          </div>
          <ul className="divide-y divide-glass-border/60">
            {collections.map((collection: any) => (
              <li key={collection.id}>
                <button
                  onClick={() => setSelectedId(collection.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-accent/40",
                    selected?.id === collection.id && "bg-accent/50",
                  )}
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-primary">
                    <Plug className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{collection.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {collection.tenant_id ?? "Global"} · {collection.record_count} tools
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </li>
            ))}
            {collections.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">No collections found.</li>
            )}
          </ul>
        </GlassCard>

        <div className="space-y-4">
          {selected && (
            <>
              <GlassCard>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Tool Collection</div>
                    <h2 className="mt-1 text-xl font-semibold">{selected.name}</h2>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {selected.tenant_id ?? "Global scope"} · Updated {formatDate(selected.updated_at)}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <ActionButton
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      const name = window.prompt("Collection name", selected.name);
                      if (!name) return;
                      updateCollection.mutate({ id: selected.id, body: { name } });
                    }}
                  >
                    Edit
                  </ActionButton>
                  <ActionButton
                    variant="ghost"
                    className="text-xs"
                    onClick={() => {
                      if (window.confirm(`Delete tool collection ${selected.name}?`)) {
                        deleteCollection.mutate(selected.id);
                      }
                    }}
                  >
                    Delete
                  </ActionButton>
                </div>
              </GlassCard>

              <GlassCard className="overflow-hidden p-0">
                <div className="flex items-center justify-between border-b border-glass-border px-5 py-4">
                  <div className="text-sm font-semibold">Tools ({records.length})</div>
                  <ActionButton variant="outline" className="text-xs" onClick={openCreateRecord}>
                    <Plus className="h-3.5 w-3.5" /> Add Tool
                  </ActionButton>
                </div>
                <DataTable
                  columns={["Tenant", "Name", "Method", "URL", "Updated", "Actions"]}
                  rows={records.map((record) => {
                    const summary = summarizeDescriptor(record.value);
                    return [
                      <span key="tenant" className="text-muted-foreground">
                        {selected.tenant_id ?? "Global"}
                      </span>,
                      <div key="name" className="min-w-0">
                        <div className="font-medium">{record.key}</div>
                        <div className="max-w-[18rem] truncate text-xs text-muted-foreground">{summary.subline}</div>
                      </div>,
                      <span key="method" className="font-mono text-xs uppercase tracking-wider text-foreground/80">
                        {parseDescriptor(record.value)?.method ?? "GET"}
                      </span>,
                      <code key="url" className="rounded bg-muted/40 px-2 py-1 font-mono text-xs text-foreground/80">
                        {parseDescriptor(record.value)?.url ?? "Invalid JSON"}
                      </code>,
                      <span key="updated" className="tabular-nums text-muted-foreground">
                        {formatDate(record.updated_at)}
                      </span>,
                      <div key="actions" className="flex gap-2">
                        <ActionButton variant="outline" className="text-xs" onClick={() => openEditRecord(record)}>
                          Edit
                        </ActionButton>
                        <ActionButton
                          variant="ghost"
                          className="text-xs"
                          onClick={() => {
                            if (window.confirm(`Delete tool ${record.key}?`)) {
                              deleteRecord.mutate({ collectionId: selected.id, recordId: record.id });
                            }
                          }}
                        >
                          Delete
                        </ActionButton>
                      </div>,
                    ];
                  })}
                />
              </GlassCard>

              <GlassCard className="p-5">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Selected collection summary</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Tool records are stored as JSON descriptors with `method`, `url`, optional `headers`,
                  optional `parameters`, and optional `timeout_ms`.
                </div>
              </GlassCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
