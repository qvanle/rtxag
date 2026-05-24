import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActionButton,
  DataTable,
  GlassCard,
  PageHeader,
} from "@/components/admin/primitives";
import { cn } from "@/lib/utils";
import { Plus, Plug, ChevronRight } from "lucide-react";
import { adminApi, formatDate, useAdminMutation, useAdminQuery } from "@/lib/admin-api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/mcp")({
  component: MCPPage,
});

function MCPPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createTenantID, setCreateTenantID] = useState("");
  const tenantsQuery = useAdminQuery(["mcp", "tenants"], adminApi.listTenants);
  const collectionsQuery = useAdminQuery(["mcp", "collections", "merged"], async () => {
    const globalCollections = await adminApi.listMCPCollections("global");
    const tenants = await adminApi.listTenants();
    const tenantCollections = await Promise.all(
      tenants.map(async (t) => ({
        collections: await adminApi.listMCPCollectionsByTenant(t.id_internal),
      })),
    );
    return [
      ...globalCollections,
      ...tenantCollections.flatMap((g) => g.collections),
    ];
  });
  const collections = useMemo(
    () => (collectionsQuery.data as any[]) ?? [],
    [collectionsQuery.data],
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
  const onCreateCollection = () => {
    const name = createName.trim();
    if (!name || !createTenantID) {
      window.alert("Tenant and collection name are required");
      return;
    }
    createCollection.mutate(
      { scope: "tenant", tenant_id: createTenantID, name },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setCreateName("");
          setCreateTenantID("");
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="MCP"
        description="Model Context Protocol collections. Each collection groups tool records exposed to assistants."
        actions={
          <>
            <ActionButton onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4" /> New Collection
            </ActionButton>
          </>
        }
      />
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="glass border-glass-border bg-gradient-to-b from-background to-muted/30 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>New MCP Collection</DialogTitle>
            <DialogDescription>Create a collection for MCP records exposed to assistants.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <select className="h-10 rounded-md border border-glass-border bg-background px-3 text-sm" value={createTenantID} onChange={(e) => setCreateTenantID(e.target.value)}>
              <option value="">Select tenant</option>
              {(tenantsQuery.data ?? []).map((t) => (
                <option key={t.id_internal} value={t.id_internal}>{t.name}</option>
              ))}
            </select>
            <input className="h-10 rounded-md border border-glass-border bg-transparent px-3 text-sm" placeholder="Collection name" value={createName} onChange={(e) => setCreateName(e.target.value)} />
          </div>
          <DialogFooter>
            <ActionButton variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</ActionButton>
            <ActionButton onClick={onCreateCollection} disabled={createCollection.isPending}>Create Collection</ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-[340px,1fr] gap-4">
        <GlassCard className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-glass-border text-xs uppercase tracking-wider text-muted-foreground">
            Collections
          </div>
          <ul className="divide-y divide-glass-border/60">
            {collections.map((c: any) => (
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
                No collections found.
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
                  columns={["Tenant", "Key", "Value", "Updated", "Actions"]}
                  rows={records.map((r) => [
                    <span key="tt" className="text-muted-foreground">{selected.tenant_id ?? "Global"}</span>,
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
