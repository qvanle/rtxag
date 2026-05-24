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
import { mcpCollections, mcpRecords } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Plus, Plug, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/mcp")({
  component: MCPPage,
});

const methodColors: Record<string, string> = {
  GET: "text-info border-info/30 bg-info/10",
  POST: "text-success border-success/30 bg-success/10",
  PUT: "text-warning border-warning/30 bg-warning/10",
  DELETE: "text-destructive border-destructive/30 bg-destructive/10",
};

function MCPPage() {
  const [scope, setScope] = useState<"global" | "tenant">("global");
  const filtered = useMemo(
    () => mcpCollections.filter((c) => c.scope === scope),
    [scope],
  );
  const [selectedId, setSelectedId] = useState<string>(filtered[0]?.id ?? "");
  const selected = mcpCollections.find((c) => c.id === selectedId) ?? filtered[0];
  const records = mcpRecords.filter((r) => r.collection === selected?.name);

  return (
    <div className="space-y-6">
      <PageHeader
        title="MCP"
        description="Model Context Protocol collections. Each collection groups tool records exposed to assistants."
        actions={
          <>
            <ScopeSwitcher
              value={scope}
              onChange={(v) => {
                setScope(v);
                const next = mcpCollections.filter((c) => c.scope === v)[0];
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
                    <Plug className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {c.tenant ?? "Global"} · {c.records} records
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
                      MCP Collection
                    </div>
                    <h2 className="text-xl font-semibold mt-1">{selected.name}</h2>
                    <div className="text-xs text-muted-foreground mt-1">
                      {selected.tenant ?? "Global scope"} · Updated {selected.updated}
                    </div>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>
              </GlassCard>

              <GlassCard className="p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-glass-border flex items-center justify-between">
                  <div className="text-sm font-semibold">Records ({records.length})</div>
                  <ActionButton variant="outline" className="text-xs">
                    <Plus className="h-3.5 w-3.5" /> Add Record
                  </ActionButton>
                </div>
                <DataTable
                  columns={["Name", "Method", "Endpoint", "Status"]}
                  rows={records.map((r) => [
                    <span key="n" className="font-medium">{r.name}</span>,
                    <span
                      key="m"
                      className={cn(
                        "inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-semibold tracking-wide",
                        methodColors[r.method],
                      )}
                    >
                      {r.method}
                    </span>,
                    <code key="e" className="text-xs font-mono text-foreground/80 bg-muted/40 px-2 py-1 rounded">
                      {r.endpoint}
                    </code>,
                    <StatusBadge key="s" status={r.status} />,
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
