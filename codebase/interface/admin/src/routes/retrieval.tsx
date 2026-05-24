import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActionButton,
  DataTable,
  GlassCard,
  PageHeader,
  StatusBadge,
} from "@/components/admin/primitives";
import { cn } from "@/lib/utils";
import { Plus, Database, FileText, ChevronRight } from "lucide-react";
import { adminApi, formatDate, useAdminMutation, useAdminQuery } from "@/lib/admin-api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/retrieval")({
  component: RetrievalPage,
});

function RetrievalPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmbeddingModel, setCreateEmbeddingModel] = useState("");
  const [createTenantID, setCreateTenantID] = useState("");
  const tenantsQuery = useAdminQuery(["retrieval", "tenants"], adminApi.listTenants);
  const modelsQuery = useAdminQuery(["retrieval", "models"], adminApi.listModels);
  const collectionsQuery = useAdminQuery(["retrieval", "collections", "merged"], async () => {
    const globalCollections = await adminApi.listRetrievalCollections("global");
    const tenants = await adminApi.listTenants();
    const tenantCollections = await Promise.all(
      tenants.map(async (t) => ({
        collections: await adminApi.listRetrievalCollectionsByTenant(t.id_internal),
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

  const docsQuery = useAdminQuery(["retrieval", "documents", selected?.id ?? "none"], () =>
    selected ? adminApi.listRetrievalDocuments(selected.id) : Promise.resolve([]),
  );
  const docs = docsQuery.data ?? [];

  const createCollection = useAdminMutation(adminApi.createRetrievalCollection);
  const updateCollection = useAdminMutation(({ id, body }: { id: string; body: any }) =>
    adminApi.updateRetrievalCollection(id, body),
  );
  const deleteCollection = useAdminMutation((id: string) => adminApi.deleteRetrievalCollection(id));
  const createDocument = useAdminMutation(({ collectionId, filename }: { collectionId: string; filename: string }) =>
    adminApi.createRetrievalDocument(collectionId, filename),
  );
  const deleteDocument = useAdminMutation(({ collectionId, documentId }: { collectionId: string; documentId: string }) =>
    adminApi.deleteRetrievalDocument(collectionId, documentId),
  );
  const reindexCollection = useAdminMutation((id: string) => adminApi.reindexRetrievalCollection(id));
  const onCreateCollection = () => {
    const name = createName.trim();
    if (!name || !createTenantID || !createEmbeddingModel) {
      window.alert("Tenant, collection name and embedding model are required");
      return;
    }
    createCollection.mutate(
      { scope: "tenant", tenant_id: createTenantID, name, embedding_model_id: createEmbeddingModel },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setCreateName("");
          setCreateEmbeddingModel("");
          setCreateTenantID("");
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Retrieval"
        description="Collection-based knowledge stores. Each collection uses one embedding model."
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
            <DialogTitle>New Retrieval Collection</DialogTitle>
            <DialogDescription>Define collection name and embedding model for indexing.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <select className="h-10 rounded-md border border-glass-border bg-background px-3 text-sm" value={createTenantID} onChange={(e) => setCreateTenantID(e.target.value)}>
              <option value="">Select tenant</option>
              {(tenantsQuery.data ?? []).map((t) => (
                <option key={t.id_internal} value={t.id_internal}>{t.name}</option>
              ))}
            </select>
            <input className="h-10 rounded-md border border-glass-border bg-transparent px-3 text-sm" placeholder="Collection name" value={createName} onChange={(e) => setCreateName(e.target.value)} />
            <select className="h-10 rounded-md border border-glass-border bg-background px-3 text-sm" value={createEmbeddingModel} onChange={(e) => setCreateEmbeddingModel(e.target.value)}>
              <option value="">Select embedding model</option>
              {(modelsQuery.data ?? []).map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
              ))}
            </select>
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
                    <Database className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {c.tenant_id ?? "Global"} · {c.document_count.toLocaleString()} docs
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
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Collection</div>
                    <h2 className="text-xl font-semibold mt-1">{selected.name}</h2>
                    <div className="text-xs text-muted-foreground mt-1">
                      {selected.tenant_id ?? "Global scope"}
                    </div>
                  </div>
                  <StatusBadge status={selected.index_status} />
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Stat label="Documents" value={selected.document_count.toLocaleString()} />
                  <Stat label="Embedding model" value={selected.embedding_model_id} small />
                  <Stat label="Updated" value={formatDate(selected.updated_at)} />
                  <Stat label="Index status" value={selected.index_status} accent />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ActionButton variant="outline" className="text-xs" onClick={() => reindexCollection.mutate(selected.id)}>Reindex</ActionButton>
                  <ActionButton
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      const name = window.prompt("Collection name", selected.name);
                      if (!name) return;
                      const embedding_model_id = window.prompt("Embedding model id", selected.embedding_model_id) ?? selected.embedding_model_id;
                      updateCollection.mutate({ id: selected.id, body: { name, embedding_model_id } });
                    }}
                  >
                    Edit
                  </ActionButton>
                  <ActionButton
                    variant="ghost"
                    className="text-xs"
                    onClick={() => {
                      if (window.confirm(`Delete collection ${selected.name}?`)) deleteCollection.mutate(selected.id);
                    }}
                  >
                    Delete
                  </ActionButton>
                </div>
              </GlassCard>

              <GlassCard className="p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-glass-border flex items-center justify-between">
                  <div className="text-sm font-semibold">Documents ({docs.length})</div>
                  <ActionButton
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      const filename = window.prompt("Document filename?");
                      if (!filename) return;
                      createDocument.mutate({ collectionId: selected.id, filename });
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" /> Upload
                  </ActionButton>
                </div>
                <DataTable
                  columns={["Tenant", "Title", "Status", "Created", "Actions"]}
                  rows={docs.map((d) => [
                    <span key="tt" className="text-muted-foreground">{selected.tenant_id ?? "Global"}</span>,
                    <div key="t" className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{d.filename}</span>
                    </div>,
                    <StatusBadge key="st" status={d.status} />,
                    <span key="u" className="text-muted-foreground tabular-nums">{formatDate(d.created_at)}</span>,
                    <ActionButton
                      key="a"
                      variant="ghost"
                      className="text-xs"
                      onClick={() => {
                        if (window.confirm(`Delete document ${d.filename}?`)) {
                          deleteDocument.mutate({ collectionId: selected.id, documentId: d.id });
                        }
                      }}
                    >
                      Delete
                    </ActionButton>,
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

function Stat({
  label,
  value,
  small,
  accent,
}: {
  label: string;
  value: string;
  small?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-glass-border bg-muted/30 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-1 font-semibold",
          small ? "text-sm" : "text-lg",
          accent && "text-success",
        )}
      >
        {value}
      </div>
    </div>
  );
}
