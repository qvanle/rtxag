import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ActionButton,
  DataTable,
  GlassCard,
  PageHeader,
  StatusBadge,
} from "@/components/admin/primitives";
import { Plus, Bot, Cpu, Database, Plug } from "lucide-react";
import { adminApi, type Assistant, useAdminMutation, useAdminQuery } from "@/lib/admin-api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({
    scope: "global" as "global" | "tenant",
    tenant_id: "",
    name: "",
    model_id: "",
    retrieval_collection_id: "",
    mcp_collection_id: "",
  });
  const tenantsQuery = useAdminQuery(["assistants", "tenants"], adminApi.listTenants);
  const modelsQuery = useAdminQuery(["assistants", "models"], adminApi.listModels);
  const retrievalOptionsQuery = useAdminQuery(["assistants", "retrieval-options"], async () => {
    const globalCols = await adminApi.listRetrievalCollections("global");
    const tenants = await adminApi.listTenants();
    const perTenant = await Promise.all(tenants.map((t) => adminApi.listRetrievalCollectionsByTenant(t.id_internal)));
    return [...globalCols, ...perTenant.flat()];
  });
  const mcpOptionsQuery = useAdminQuery(["assistants", "mcp-options"], async () => {
    const globalCols = await adminApi.listMCPCollections("global");
    const tenants = await adminApi.listTenants();
    const perTenant = await Promise.all(tenants.map((t) => adminApi.listMCPCollectionsByTenant(t.id_internal)));
    return [...globalCols, ...perTenant.flat()];
  });
  const assistantsQuery = useAdminQuery(["assistants", "merged"], async () => {
    const globalAssistants = await adminApi.listAssistants("global");
    const tenants = await adminApi.listTenants();
    const tenantAssistants = await Promise.all(
      tenants.map(async (t) => ({
        assistants: await adminApi.listAssistantsByTenant(t.id_internal),
      })),
    );
    return [
      ...globalAssistants,
      ...tenantAssistants.flatMap((g) => g.assistants),
    ];
  });
  const filtered = useMemo(
    () => (assistantsQuery.data as Assistant[]) ?? [],
    [assistantsQuery.data],
  );

  const createAssistant = useAdminMutation(adminApi.createAssistant);
  const updateAssistant = useAdminMutation(({ id, body }: { id: string; body: any }) =>
    adminApi.updateAssistant(id, body),
  );
  const deleteAssistant = useAdminMutation((id: string) => adminApi.deleteAssistant(id));
  const activateAssistant = useAdminMutation((id: string) => adminApi.activateAssistant(id));
  const cloneAssistant = useAdminMutation(({ id, target_scope }: { id: string; target_scope: "global" | "tenant" }) =>
    adminApi.cloneAssistant(id, { target_scope }),
  );

  const onCreate = () => {
    const model_ids = form.model_id ? [form.model_id] : [];
    const retrieval_collection_ids = form.retrieval_collection_id ? [form.retrieval_collection_id] : [];
    const mcp_collection_ids = form.mcp_collection_id ? [form.mcp_collection_id] : [];
    if (!model_ids.length) {
      window.alert("At least one model_id is required");
      return;
    }
    if (form.scope === "tenant" && !form.tenant_id) {
      window.alert("Tenant is required for tenant scope");
      return;
    }

    createAssistant.mutate(
      {
        scope: form.scope,
        tenant_id: form.scope === "tenant" ? form.tenant_id : undefined,
        name: form.name.trim(),
        model_ids,
        retrieval_collection_ids,
        mcp_collection_ids,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setForm({ scope: "global", tenant_id: "", name: "", model_id: "", retrieval_collection_id: "", mcp_collection_id: "" });
        },
      },
    );
  };

  const onEdit = (a: Assistant) => {
    const name = window.prompt("Assistant name", a.name);
    if (!name) return;
    const model_ids = (window.prompt("Model IDs (comma-separated)", a.model_ids.join(",")) ?? a.model_ids.join(","))
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    const retrieval_collection_ids = (window.prompt(
      "Retrieval IDs (comma-separated)",
      a.retrieval_collection_ids.join(","),
    ) ?? a.retrieval_collection_ids.join(","))
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    const mcp_collection_ids = (window.prompt("MCP IDs (comma-separated)", a.mcp_collection_ids.join(",")) ?? a.mcp_collection_ids.join(","))
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    updateAssistant.mutate({ id: a.id, body: { name, model_ids, retrieval_collection_ids, mcp_collection_ids } });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assistants"
        description="Compose assistants from Models, Retrieval collections and MCP collections."
        actions={
          <ActionButton onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New Assistant
          </ActionButton>
        }
      />
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="glass border-glass-border bg-gradient-to-b from-background to-muted/30 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>New Assistant</DialogTitle>
            <DialogDescription>Compose assistant inputs with model, retrieval and MCP IDs.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <select className="h-10 rounded-md border border-glass-border bg-background px-3 text-sm" value={form.scope} onChange={(e) => setForm((v) => ({ ...v, scope: e.target.value as "global" | "tenant", tenant_id: e.target.value === "tenant" ? v.tenant_id : "" }))}>
              <option value="global">Global</option>
              <option value="tenant">Per Tenant</option>
            </select>
            <select className="h-10 rounded-md border border-glass-border bg-background px-3 text-sm" value={form.tenant_id} onChange={(e) => setForm((v) => ({ ...v, tenant_id: e.target.value }))} disabled={form.scope !== "tenant"}>
              <option value="">Select tenant</option>
              {(tenantsQuery.data ?? []).map((t) => (
                <option key={t.id_internal} value={t.id_internal}>{t.name}</option>
              ))}
            </select>
            <input className="h-10 rounded-md border border-glass-border bg-transparent px-3 text-sm" placeholder="Assistant name" value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} />
            <select className="h-10 rounded-md border border-glass-border bg-background px-3 text-sm" value={form.model_id} onChange={(e) => setForm((v) => ({ ...v, model_id: e.target.value }))}>
              <option value="">Select model</option>
              {(modelsQuery.data ?? []).map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
              ))}
            </select>
            <select className="h-10 rounded-md border border-glass-border bg-background px-3 text-sm" value={form.retrieval_collection_id} onChange={(e) => setForm((v) => ({ ...v, retrieval_collection_id: e.target.value }))}>
              <option value="">Select retrieval collection (optional)</option>
              {(retrievalOptionsQuery.data ?? []).map((r) => (
                <option key={r.id} value={r.id}>{r.name} ({r.tenant_id ?? "Global"})</option>
              ))}
            </select>
            <select className="h-10 rounded-md border border-glass-border bg-background px-3 text-sm" value={form.mcp_collection_id} onChange={(e) => setForm((v) => ({ ...v, mcp_collection_id: e.target.value }))}>
              <option value="">Select MCP collection (optional)</option>
              {(mcpOptionsQuery.data ?? []).map((mc) => (
                <option key={mc.id} value={mc.id}>{mc.name} ({mc.tenant_id ?? "Global"})</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <ActionButton variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</ActionButton>
            <ActionButton onClick={onCreate} disabled={createAssistant.isPending}>Create Assistant</ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!!assistantsQuery.error && (
        <div className="text-sm text-destructive">{(assistantsQuery.error as Error).message}</div>
      )}

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
                    {a.tenant_id ?? "Global"} · {a.version}
                  </div>
                </div>
              </div>
              <StatusBadge status={a.status} />
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {a.model_ids.map((m) => (
                  <Chip key={m} icon={Cpu} label={m} />
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {a.retrieval_collection_ids.map((r) => (
                  <Chip key={r} icon={Database} label={r} />
                ))}
              </div>
              {a.mcp_collection_ids.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {a.mcp_collection_ids.map((m) => (
                    <Chip key={m} icon={Plug} label={m} />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-glass-border flex gap-2 flex-wrap">
              <ActionButton variant="outline" className="justify-center" onClick={() => onEdit(a)}>
                Edit
              </ActionButton>
              <ActionButton variant="ghost" className="justify-center" onClick={() => activateAssistant.mutate(a.id)}>
                Activate
              </ActionButton>
              <ActionButton
                variant="ghost"
                className="justify-center"
                onClick={() => cloneAssistant.mutate({ id: a.id, target_scope: a.scope })}
              >
                Clone
              </ActionButton>
              <ActionButton
                variant="ghost"
                className="justify-center"
                onClick={() => {
                  if (window.confirm(`Delete assistant ${a.name}?`)) {
                    deleteAssistant.mutate(a.id);
                  }
                }}
              >
                Delete
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
          columns={["Tenant", "Name", "Scope", "Models", "Retrieval", "MCP", "Version", "Status"]}
          rows={filtered.map((a) => [
            <span key="t" className="text-muted-foreground">{a.tenant_id ?? "Global"}</span>,
            <span key="n" className="font-medium">{a.name}</span>,
            <span key="s" className="text-muted-foreground capitalize">{a.scope}</span>,
            <span key="m" className="text-foreground/80">{a.model_ids.join(", ")}</span>,
            <span key="r" className="text-foreground/80">{a.retrieval_collection_ids.join(", ") || "-"}</span>,
            <span key="mc" className="text-foreground/80">{a.mcp_collection_ids.join(", ") || "-"}</span>,
            <span key="v" className="tabular-nums">{a.version}</span>,
            <StatusBadge key="st" status={a.status} />,
          ])}
        />
      </GlassCard>
    </div>
  );
}
