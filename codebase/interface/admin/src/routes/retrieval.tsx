import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ActionButton,
  DataTable,
  GlassCard,
  PageHeader,
  ScopeSwitcher,
  StatusBadge,
} from "@/components/admin/primitives";
import { documents, retrievalCollections } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Plus, Database, FileText, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/retrieval")({
  component: RetrievalPage,
});

function RetrievalPage() {
  const [scope, setScope] = useState<"global" | "tenant">("global");
  const filtered = useMemo(
    () => retrievalCollections.filter((c) => c.scope === scope),
    [scope],
  );
  const [selectedId, setSelectedId] = useState<string>(filtered[0]?.id ?? "");
  const selected =
    retrievalCollections.find((c) => c.id === selectedId) ?? filtered[0];
  const docs = documents.filter((d) => d.collection === selected?.name);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Retrieval"
        description="Collection-based knowledge stores. Each collection uses one embedding model."
        actions={
          <>
            <ScopeSwitcher
              value={scope}
              onChange={(v) => {
                setScope(v);
                const next = retrievalCollections.filter((c) => c.scope === v)[0];
                setSelectedId(next?.id ?? "");
              }}
            />
            <ActionButton>
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
            {filtered.map((c) => (
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
                      {c.tenant ?? "Global"} · {c.docs.toLocaleString()} docs
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
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
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      Collection
                    </div>
                    <h2 className="text-xl font-semibold mt-1">{selected.name}</h2>
                    <div className="text-xs text-muted-foreground mt-1">
                      {selected.tenant ?? "Global scope"}
                    </div>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Stat label="Documents" value={selected.docs.toLocaleString()} />
                  <Stat label="Embedding model" value={selected.embeddingModel} small />
                  <Stat label="Updated" value={selected.updated} />
                  <Stat label="Index health" value="100%" accent />
                </div>
              </GlassCard>

              <GlassCard className="p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-glass-border flex items-center justify-between">
                  <div className="text-sm font-semibold">Documents ({docs.length})</div>
                  <ActionButton variant="outline" className="text-xs">
                    <Plus className="h-3.5 w-3.5" /> Upload
                  </ActionButton>
                </div>
                <DataTable
                  columns={["Title", "Size", "Status", "Updated"]}
                  rows={docs.map((d) => [
                    <div key="t" className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{d.title}</span>
                    </div>,
                    <span key="s" className="text-muted-foreground tabular-nums">{d.size}</span>,
                    <StatusBadge key="st" status={d.status} />,
                    <span key="u" className="text-muted-foreground tabular-nums">{d.updated}</span>,
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
