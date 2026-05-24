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
import { assistants } from "@/lib/mock-data";
import { Plus, Bot, Cpu, Database, Plug } from "lucide-react";

export const Route = createFileRoute("/assistant")({
  component: AssistantsPage,
});

function Chip({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-glass-border bg-muted/40 px-2 py-0.5 text-[11px] text-foreground/80">
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function AssistantsPage() {
  const [scope, setScope] = useState<"global" | "tenant">("global");
  const filtered = useMemo(
    () => assistants.filter((a) => a.scope === scope),
    [scope],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assistants"
        description="Compose assistants from Models, Retrieval collections and MCP collections."
        actions={
          <>
            <ScopeSwitcher value={scope} onChange={setScope} />
            <ActionButton>
              <Plus className="h-4 w-4" /> New Assistant
            </ActionButton>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((a) => (
          <GlassCard key={a.id} className="flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-semibold leading-tight">{a.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.tenant ?? "Global"} · {a.version}
                  </div>
                </div>
              </div>
              <StatusBadge status={a.status} />
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {a.models.map((m) => (
                  <Chip key={m} icon={Cpu} label={m} />
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {a.retrieval.map((r) => (
                  <Chip key={r} icon={Database} label={r} />
                ))}
              </div>
              {a.mcp.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {a.mcp.map((m) => (
                    <Chip key={m} icon={Plug} label={m} />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-glass-border flex gap-2">
              <ActionButton variant="outline" className="flex-1 justify-center">
                Edit
              </ActionButton>
              <ActionButton variant="ghost" className="justify-center">
                Logs
              </ActionButton>
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-glass-border">
          <div className="text-sm font-semibold">All assistants ({filtered.length})</div>
        </div>
        <DataTable
          columns={["Name", "Scope", "Models", "Retrieval", "MCP", "Version", "Status"]}
          rows={filtered.map((a) => [
            <span key="n" className="font-medium">{a.name}</span>,
            <span key="s" className="text-muted-foreground">{a.tenant ?? "Global"}</span>,
            <span key="m" className="text-foreground/80">{a.models.join(", ")}</span>,
            <span key="r" className="text-foreground/80">{a.retrieval.join(", ") || "—"}</span>,
            <span key="mc" className="text-foreground/80">{a.mcp.join(", ") || "—"}</span>,
            <span key="v" className="tabular-nums">{a.version}</span>,
            <StatusBadge key="st" status={a.status} />,
          ])}
        />
      </GlassCard>
    </div>
  );
}
