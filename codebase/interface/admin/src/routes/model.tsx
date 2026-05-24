import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ActionButton,
  DataTable,
  GlassCard,
  PageHeader,
  StatusBadge,
} from "@/components/admin/primitives";
import { models, providers } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Plus, KeyRound } from "lucide-react";

export const Route = createFileRoute("/model")({
  component: ModelPage,
});

function ModelPage() {
  const [tab, setTab] = useState<"models" | "providers">("models");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Models"
        description="Central registry of foundation models and the providers that serve them."
        actions={
          <ActionButton>
            <Plus className="h-4 w-4" />
            {tab === "models" ? "Add Model" : "Add Provider"}
          </ActionButton>
        }
      />

      <div className="inline-flex p-1 rounded-lg glass border border-glass-border">
        {(["models", "providers"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-1.5 text-xs font-medium rounded-md capitalize transition-all",
              tab === t
                ? "bg-gradient-primary text-primary-foreground shadow-glow"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "models" ? (
        <GlassCard className="p-0 overflow-hidden">
          <DataTable
            columns={["Name", "Provider", "Version", "Status", "Updated"]}
            rows={models.map((m) => [
              <span key="n" className="font-medium">{m.name}</span>,
              <span key="p" className="text-foreground/80">{m.provider}</span>,
              <span key="v" className="tabular-nums text-muted-foreground">{m.version}</span>,
              <StatusBadge key="s" status={m.status} />,
              <span key="u" className="text-muted-foreground tabular-nums">{m.updated}</span>,
            ])}
          />
        </GlassCard>
      ) : (
        <GlassCard className="p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-glass-border flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Provider routing</div>
              <div className="text-xs text-muted-foreground">
                Enable or disable providers for fallback routing.
              </div>
            </div>
          </div>
          <DataTable
            columns={["Provider", "Environment", "Priority", "API Key", "Status", ""]}
            rows={providers.map((p) => [
              <div key="n" className="flex items-center gap-2 font-medium">
                <div className="h-7 w-7 rounded-md bg-gradient-primary grid place-items-center">
                  <KeyRound className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                {p.name}
              </div>,
              <span key="e" className="capitalize text-foreground/80">{p.env}</span>,
              <span key="pr" className="tabular-nums">#{p.priority}</span>,
              <code key="k" className="text-xs font-mono text-muted-foreground bg-muted/40 px-2 py-1 rounded">
                {p.apiKey}
              </code>,
              <StatusBadge key="s" status={p.status} />,
              <ActionButton key="a" variant="outline" className="text-xs">
                {p.status === "enabled" ? "Disable" : "Enable"}
              </ActionButton>,
            ])}
          />
        </GlassCard>
      )}
    </div>
  );
}
