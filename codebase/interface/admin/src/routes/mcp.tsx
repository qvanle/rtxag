import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActionButton,
  DataTable,
  GlassCard,
  PageHeader,
  ScopeSwitcher,
} from "@/components/admin/primitives";
import { cn } from "@/lib/utils";
import { Plus, Plug, ChevronRight } from "lucide-react";
import { adminApi, formatDate, useAdminMutation, useAdminQuery } from "@/lib/admin-api";

export const Route = createFileRoute("/mcp")({
  component: MCPPage,
});

function MCPPage() {
  const [scope, setScope] = useState<"global" | "tenant">("global");
  const collectionsQuery = useAdminQuery(["mcp", "collections", scope], async () => {
    if (scope === "global") return adminApi.listMCPCollections("global");
    const tenants = await adminApi.listTenants();
    return Promise.all(
      tenants.map(async (t) => ({
        tenantId: t.id_internal,
        tenantName: t.name,
        collections: await adminApi.listMCPCollectionsByTenant(t.id_internal),
      })),
    );
  });
  const tenantGroups = useMemo(
    () => (scope === "tenant" ? ((collectionsQuery.data as any[]) ?? []) : []),
    [collectionsQuery.data, scope],
  );
  const collections = useMemo(
    () =>
      scope === "tenant"
        ? tenantGroups.flatMap((g) => g.collections)
        : ((collectionsQuery.data as any[]) ?? []),
    [collectionsQuery.data, scope, tenantGroups],
  );

  const [selectedId, setSelectedId] = useState<string>("");
  useEffect(() => {
    if (!collections.length) {
      setSelectedId("");
      return;
    }
    if (!collections.some((c) => c.id === selectedId)) {
      setSelectedId(collections[0].id);
    }
  }, [collections, selectedId]);

  const selected = useMemo(
    () => collections.find((c) => c.id === selectedId) ?? collections[0],
    [collections, selectedId],
  );

  const recordsQuery = useAdminQuery(["mcp", "records", selected?.id ?? "none"], () =>
    selected ? adminApi.listMCPRecords(selected.id) : Promise.resolve([]),
  );
  const records = recordsQuery.data ?? [];

  const createCollection = useAdminMutation(adminApi.createMCPCollection);
  const updateCollection = useAdminMutation(({ id, body }: { id: string; body: any }) =>
    adminApi.updateMCPCollection(id, body),
  );
  const deleteCollection = useAdminMutation((id: string) => adminApi.deleteMCPCollection(id));

  const createRecord = useAdminMutation(({ collectionId, body }: { collectionId: string; body: { key: string; value: string } }) =>
    adminApi.createMCPRecord(collectionId, body),
  );
  const updateRecord = useAdminMutation(({ collectionId, recordId, body }: { collectionId: string; recordId: string; body: { key?: string; value?: string } }) =>
    adminApi.updateMCPRecord(collectionId, recordId, body),
  );
  const deleteRecord = useAdminMutation(({ collectionId, recordId }: { collectionId: string; recordId: string }) =>
    adminApi.deleteMCPRecord(collectionId, recordId),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="MCP"
        description="Model Context Protocol collections. Each collection groups tool records exposed to assistants."
        actions={
          <>
            <ScopeSwitcher value={scope} onChange={setScope} />
            <ActionButton
              onClick={() => {
                const name = window.prompt("Collection name?");
                if (!name) return;
                createCollection.mutate({ scope, name });
              }}
            >
              <Plus className="h-4 w-4" /> New Collection
            </ActionButton>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[340px,1fr] gap-4">
        <GlassCard className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-glass-border text-xs uppercase tracking-wider text-muted-foreground">
            Collections
          </div>
          <ul className="divide-y divide-glass-border/60">
            {scope === "tenant"
              ? tenantGroups.map((group) => (
                  <li key={group.tenantId}>
                    <div className="px-4 py-2 text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/20">
                      {group.tenantName} ({group.tenantId})
                    </div>
                    <ul className="divide-y divide-glass-border/60">
                      {group.collections.map((c: any) => (
                        <li key={c.id}>
                          <button
                            onClick={() => setSelectedId(c.id)}
                            className={cn(
                              "w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-accent/40 transition",
                              selected?.id === c.id && "bg-accent/50",
                            )}
                          >
                            <div className="h-9 w-9 rounded-lg bg-gradient-primary grid place-items-center shrink-0">
                              <Plug className="h-4 w-4 text-primary-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{c.name}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {c.tenant_id ?? "Global"} · {c.record_count} records
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))
              : collections.map((c: any) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelectedId(c.id)}
                      className={cn(
                        "w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-accent/40 transition",
                        selected?.id === c.id && "bg-accent/50",
                      )}
                    >
                      <div className="h-9 w-9 rounded-lg bg-gradient-primary grid place-items-center shrink-0">
                        <Plug className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{c.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {c.tenant_id ?? "Global"} · {c.record_count} records
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </li>
                ))}
            {collections.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                No collections in this scope.
              </li>
            )}
          </ul>
        </GlassCard>

        <div className="space-y-4">
          {selected && (
            <>
              <GlassCard>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">MCP Collection</div>
                    <h2 className="text-xl font-semibold mt-1">{selected.name}</h2>
                    <div className="text-xs text-muted-foreground mt-1">
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
                      if (window.confirm(`Delete MCP collection ${selected.name}?`)) deleteCollection.mutate(selected.id);
                    }}
                  >
                    Delete
                  </ActionButton>
                </div>
              </GlassCard>

              <GlassCard className="p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-glass-border flex items-center justify-between">
                  <div className="text-sm font-semibold">Records ({records.length})</div>
                  <ActionButton
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      const key = window.prompt("Record key?");
                      if (!key) return;
                      const value = window.prompt("Record value?") ?? "";
                      createRecord.mutate({ collectionId: selected.id, body: { key, value } });
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Record
                  </ActionButton>
                </div>
                <DataTable
                  columns={["Key", "Value", "Updated", "Actions"]}
                  rows={records.map((r) => [
                    <span key="n" className="font-medium">{r.key}</span>,
                    <code key="e" className="text-xs font-mono text-foreground/80 bg-muted/40 px-2 py-1 rounded">
                      {r.value}
                    </code>,
                    <span key="u" className="text-muted-foreground tabular-nums">{formatDate(r.updated_at)}</span>,
                    <div key="a" className="flex gap-2">
                      <ActionButton
                        variant="outline"
                        className="text-xs"
                        onClick={() => {
                          const key = window.prompt("Record key", r.key);
                          if (!key) return;
                          const value = window.prompt("Record value", r.value) ?? r.value;
                          updateRecord.mutate({ collectionId: selected.id, recordId: r.id, body: { key, value } });
                        }}
                      >
                        Edit
                      </ActionButton>
                      <ActionButton
                        variant="ghost"
                        className="text-xs"
                        onClick={() => {
                          if (window.confirm(`Delete record ${r.key}?`)) {
                            deleteRecord.mutate({ collectionId: selected.id, recordId: r.id });
                          }
                        }}
                      >
                        Delete
                      </ActionButton>
                    </div>,
                  ])}
                />
              </GlassCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
