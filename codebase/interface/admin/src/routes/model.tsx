import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ActionButton,
  DataTable,
  GlassCard,
  PageHeader,
  StatusBadge,
} from "@/components/admin/primitives";
import { cn } from "@/lib/utils";
import { Plus, KeyRound } from "lucide-react";
import {
  adminApi,
  formatDate,
  type Model,
  type Provider,
  useAdminMutation,
  useAdminQuery,
} from "@/lib/admin-api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/model")({
  component: ModelPage,
});

function ModelPage() {
  const [tab, setTab] = useState<"models" | "providers">("models");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [modelForm, setModelForm] = useState({ name: "", provider: "", version: "", status: "active" as Model["status"] });
  const [providerForm, setProviderForm] = useState({ name: "", environment: "production", priority: 1, api_key: "", enabled: true });

  const modelsQuery = useAdminQuery(["models"], adminApi.listModels);
  const providersQuery = useAdminQuery(["providers"], adminApi.listProviders);

  const createModel = useAdminMutation(adminApi.createModel);
  const updateModel = useAdminMutation(({ id, body }: { id: string; body: any }) =>
    adminApi.updateModel(id, body),
  );
  const deleteModel = useAdminMutation((id: string) => adminApi.deleteModel(id));

  const createProvider = useAdminMutation(adminApi.createProvider);
  const updateProvider = useAdminMutation(({ id, body }: { id: string; body: any }) =>
    adminApi.updateProvider(id, body),
  );
  const toggleProvider = useAdminMutation((id: string) => adminApi.toggleProvider(id));
  const reorderProviders = useAdminMutation((ids: string[]) => adminApi.reorderProviders(ids));

  const error = (modelsQuery.error as Error | undefined)?.message ??
    (providersQuery.error as Error | undefined)?.message;

  const models = modelsQuery.data ?? [];
  const providers = providersQuery.data ?? [];

  const onAddModel = () => {
    if (!modelForm.name.trim()) return;
    createModel.mutate(
      { name: modelForm.name.trim(), provider: modelForm.provider.trim(), version: modelForm.version.trim(), status: modelForm.status },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setModelForm({ name: "", provider: "", version: "", status: "active" });
        },
      },
    );
  };

  const onEditModel = (m: Model) => {
    const name = window.prompt("Model name", m.name);
    if (!name) return;
    const provider = window.prompt("Provider", m.provider) ?? m.provider;
    const version = window.prompt("Version", m.version) ?? m.version;
    const status = (window.prompt("Status (active|draft|deprecated|archived)", m.status) ?? m.status) as Model["status"];
    updateModel.mutate({ id: m.id, body: { name, provider, version, status } });
  };

  const onAddProvider = () => {
    if (!providerForm.name.trim()) return;
    createProvider.mutate(
      {
        name: providerForm.name.trim(),
        environment: providerForm.environment,
        priority: Number(providerForm.priority) || 1,
        api_key: providerForm.api_key.trim() || "dev-key",
        enabled: providerForm.enabled,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setProviderForm({ name: "", environment: "production", priority: 1, api_key: "", enabled: true });
        },
      },
    );
  };

  const onEditProvider = (p: Provider) => {
    const name = window.prompt("Provider name", p.name);
    if (!name) return;
    const environment = window.prompt("Environment (production|staging)", p.environment) ?? p.environment;
    const priority = Number(window.prompt("Priority", String(p.priority)) ?? p.priority);
    const api_key = window.prompt("API key (used for update payload)", "updated-key") ?? "updated-key";
    const enabled = (window.prompt("Enabled? (true|false)", String(p.enabled)) ?? String(p.enabled)) === "true";
    updateProvider.mutate({ id: p.id, body: { name, environment, priority, api_key, enabled } });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Models"
        description="Central registry of foundation models and the providers that serve them."
        actions={
          <ActionButton onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            {tab === "models" ? "Add Model" : "Add Provider"}
          </ActionButton>
        }
      />

      {!!error && <div className="text-sm text-destructive">{error}</div>}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="glass border-glass-border bg-gradient-to-b from-background to-muted/30 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tab === "models" ? "Create Model" : "Create Provider"}</DialogTitle>
            <DialogDescription>
              {tab === "models" ? "Register a new model in the catalog." : "Add a provider endpoint for model routing."}
            </DialogDescription>
          </DialogHeader>
          {tab === "models" ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/90">Model name <span className="text-destructive">*</span></label>
                <input
                  className="h-11 w-full rounded-md border border-glass-border bg-transparent px-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                  placeholder="e.g., GPT-4, Claude 3"
                  value={modelForm.name}
                  onChange={(e) => setModelForm((v) => ({ ...v, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/90">Provider <span className="text-destructive">*</span></label>
                <select
                  className="h-11 w-full rounded-md border border-glass-border bg-background px-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                  value={modelForm.provider}
                  onChange={(e) => setModelForm((v) => ({ ...v, provider: e.target.value }))}
                >
                  <option value="">Select provider</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/90">Version <span className="text-destructive">*</span></label>
                <input
                  className="h-11 w-full rounded-md border border-glass-border bg-transparent px-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                  placeholder="e.g., 2024-11-20"
                  value={modelForm.version}
                  onChange={(e) => setModelForm((v) => ({ ...v, version: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/90">Status <span className="text-destructive">*</span></label>
                <select
                  className="h-11 w-full rounded-md border border-glass-border bg-background px-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                  value={modelForm.status}
                  onChange={(e) => setModelForm((v) => ({ ...v, status: e.target.value as Model["status"] }))}
                >
                  <option value="active">active</option>
                  <option value="draft">draft</option>
                  <option value="deprecated">deprecated</option>
                  <option value="archived">archived</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="h-10 rounded-md border border-glass-border bg-transparent px-3 text-sm" placeholder="Provider name" value={providerForm.name} onChange={(e) => setProviderForm((v) => ({ ...v, name: e.target.value }))} />
              <select className="h-10 rounded-md border border-glass-border bg-background px-3 text-sm" value={providerForm.environment} onChange={(e) => setProviderForm((v) => ({ ...v, environment: e.target.value }))}>
                <option value="production">production</option>
                <option value="staging">staging</option>
              </select>
              <input className="h-10 rounded-md border border-glass-border bg-transparent px-3 text-sm" placeholder="Priority" type="number" value={providerForm.priority} onChange={(e) => setProviderForm((v) => ({ ...v, priority: Number(e.target.value) }))} />
              <input className="h-10 rounded-md border border-glass-border bg-transparent px-3 text-sm" placeholder="API key" value={providerForm.api_key} onChange={(e) => setProviderForm((v) => ({ ...v, api_key: e.target.value }))} />
            </div>
          )}
          <DialogFooter className="mt-2 border-t border-glass-border/70 pt-4">
            <ActionButton variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</ActionButton>
            <ActionButton className="h-11" onClick={tab === "models" ? onAddModel : onAddProvider} disabled={createModel.isPending || createProvider.isPending}>
              {tab === "models" ? "Create Model" : "Create Provider"}
            </ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            columns={["Name", "Provider", "Version", "Status", "Updated", "Actions"]}
            rows={models.map((m) => [
              <span key="n" className="font-medium">{m.name}</span>,
              <span key="p" className="text-foreground/80">{m.provider}</span>,
              <span key="v" className="tabular-nums text-muted-foreground">{m.version}</span>,
              <StatusBadge key="s" status={m.status} />,
              <span key="u" className="text-muted-foreground tabular-nums">{formatDate(m.updated_at)}</span>,
              <div key="a" className="flex gap-2">
                <ActionButton variant="outline" className="text-xs" onClick={() => onEditModel(m)}>Edit</ActionButton>
                <ActionButton
                  variant="ghost"
                  className="text-xs"
                  onClick={() => {
                    if (window.confirm(`Delete model ${m.name}?`)) {
                      deleteModel.mutate(m.id);
                    }
                  }}
                >
                  Delete
                </ActionButton>
              </div>,
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
            <ActionButton
              variant="outline"
              className="text-xs"
              onClick={() => reorderProviders.mutate([...providers].sort((a, b) => a.priority - b.priority).map((p) => p.id))}
            >
              Normalize Priority
            </ActionButton>
          </div>
          <DataTable
            columns={["Provider", "Environment", "Priority", "API Key", "Status", "Actions"]}
            rows={providers.map((p) => [
              <div key="n" className="flex items-center gap-2 font-medium">
                <div className="h-7 w-7 rounded-md bg-gradient-primary grid place-items-center">
                  <KeyRound className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                {p.name}
              </div>,
              <span key="e" className="capitalize text-foreground/80">{p.environment}</span>,
              <span key="pr" className="tabular-nums">#{p.priority}</span>,
              <code key="k" className="text-xs font-mono text-muted-foreground bg-muted/40 px-2 py-1 rounded">
                {p.api_key_masked}
              </code>,
              <StatusBadge key="s" status={p.enabled ? "enabled" : "disabled"} />,
              <div key="a" className="flex gap-2">
                <ActionButton variant="outline" className="text-xs" onClick={() => toggleProvider.mutate(p.id)}>
                  {p.enabled ? "Disable" : "Enable"}
                </ActionButton>
                <ActionButton variant="ghost" className="text-xs" onClick={() => onEditProvider(p)}>
                  Edit
                </ActionButton>
              </div>,
            ])}
          />
        </GlassCard>
      )}
    </div>
  );
}
