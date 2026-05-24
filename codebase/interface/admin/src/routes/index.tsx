import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ActionButton,
  GlassCard,
  PageHeader,
  ScopeSwitcher,
  StatusBadge,
  DataTable,
} from "@/components/admin/primitives";
import { Activity, DollarSign, AlertTriangle, Gauge } from "lucide-react";
import { adminApi, useAdminMutation, useAdminQuery } from "@/lib/admin-api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function KpiTile({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <GlassCard>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight">{value || "-"}</div>
        </div>
        <div className="h-10 w-10 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>
    </GlassCard>
  );
}

function Dashboard() {
  const [scope, setScope] = useState<"global" | "tenant">("global");
  const [isAddingTenant, setIsAddingTenant] = useState(false);
  const [tenantExternalId, setTenantExternalId] = useState("");
  const [tenantName, setTenantName] = useState("");
  const globalQuery = useAdminQuery(["dashboard", "global"], adminApi.dashboardGlobal);
  const dashboardTenantsQuery = useAdminQuery(["dashboard", "tenants"], () =>
    adminApi.dashboardTenants(),
  );
  const tenantsQuery = useAdminQuery(["tenants"], () => adminApi.listTenants());
  const createTenant = useAdminMutation(adminApi.createTenant);
  const updateTenant = useAdminMutation(
    ({ idInternal, body }: { idInternal: string; body: { id_external?: string; name?: string } }) =>
      adminApi.updateTenant(idInternal, body),
  );
  const deleteTenant = useAdminMutation((idInternal: string) => adminApi.deleteTenant(idInternal));

  if (
    globalQuery.isLoading ||
    dashboardTenantsQuery.isLoading ||
    tenantsQuery.isLoading
  ) {
    return <div className="text-sm text-muted-foreground">Loading dashboard...</div>;
  }

  if (globalQuery.error || dashboardTenantsQuery.error || tenantsQuery.error) {
    return (
      <div className="text-sm text-destructive">
        {(globalQuery.error as Error | undefined)?.message ??
          (dashboardTenantsQuery.error as Error | undefined)?.message ??
          (tenantsQuery.error as Error | undefined)?.message ??
          "Failed to load dashboard"}
      </div>
    );
  }

  const global = globalQuery.data;
  const dashboardTenants = dashboardTenantsQuery.data ?? [];
  const tenants = tenantsQuery.data ?? [];
  const dashboardRowsByTenantId = new Map(
    dashboardTenants.map((row) => [row.tenant_id, row]),
  );

  const toInternalTenantId = (externalId: string) => {
    const slug = externalId
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    return slug ? `tenant_${slug}` : "";
  };

  const onSubmitTenant = () => {
    const idExternal = tenantExternalId.trim();
    const name = tenantName.trim();
    if (!idExternal || !name) {
      window.alert("External ID and Name are required");
      return;
    }

    const idInternal = toInternalTenantId(idExternal);
    if (!idInternal) {
      window.alert("External ID must contain at least one letter or number");
      return;
    }

    createTenant.mutate(
      { id_internal: idInternal, id_external: idExternal, name },
      {
        onSuccess: () => {
          setTenantExternalId("");
          setTenantName("");
          setIsAddingTenant(false);
        },
      },
    );
  };

  const onEditTenant = (tenant: { id_internal: string; id_external: string; name: string }) => {
    const nextExternal = (window.prompt("External ID", tenant.id_external) ?? tenant.id_external).trim();
    const nextName = (window.prompt("Name", tenant.name) ?? tenant.name).trim();
    if (!nextExternal || !nextName) {
      window.alert("External ID and Name are required");
      return;
    }
    updateTenant.mutate({
      idInternal: tenant.id_internal,
      body: { id_external: nextExternal, name: nextName },
    });
  };

  const onDeleteTenant = (tenant: { id_internal: string; name: string }) => {
    if (!window.confirm(`Delete tenant ${tenant.name} (${tenant.id_internal})?`)) return;
    deleteTenant.mutate(tenant.id_internal);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="System observability across global infrastructure and tenant operations."
        actions={
          <>
            <ScopeSwitcher value={scope} onChange={setScope} />
            <ActionButton variant="outline" onClick={() => setIsAddingTenant(true)}>
              Add tenant
            </ActionButton>
          </>
        }
      />

      <Dialog open={isAddingTenant} onOpenChange={setIsAddingTenant}>
        <DialogContent className="glass border-glass-border bg-gradient-to-b from-background to-muted/30 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Tenant</DialogTitle>
            <DialogDescription>Create a new tenant with external identity mapping.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="h-10 rounded-md border border-glass-border bg-transparent px-3 text-sm outline-none focus:border-primary"
              placeholder="External ID"
              value={tenantExternalId}
              onChange={(event) => setTenantExternalId(event.target.value)}
            />
            <input
              className="h-10 rounded-md border border-glass-border bg-transparent px-3 text-sm outline-none focus:border-primary"
              placeholder="Name"
              value={tenantName}
              onChange={(event) => setTenantName(event.target.value)}
            />
          </div>
          {!!createTenant.error && (
            <div className="text-sm text-destructive">{(createTenant.error as Error).message}</div>
          )}
          <DialogFooter>
            <ActionButton variant="ghost" onClick={() => setIsAddingTenant(false)}>Cancel</ActionButton>
            <ActionButton onClick={onSubmitTenant} disabled={createTenant.isPending}>
              {createTenant.isPending ? "Creating..." : "Create Tenant"}
            </ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {scope === "global" ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiTile icon={Activity} label="Token consumption" value={global?.token_consumption ?? "-"} />
            <KpiTile icon={DollarSign} label="Cost" value={global?.tenant_cost ?? "-"} />
            <KpiTile icon={AlertTriangle} label="Error rate" value={global?.api_error_rate ?? "-"} />
            <KpiTile icon={Gauge} label="P95 latency" value={global?.p95_latency ?? "-"} />
          </div>

          <GlassCard>
            <div className="text-sm font-semibold">Traffic summary</div>
            <div className="mt-2 text-sm text-muted-foreground">{global?.traffic_summary ?? "No data"}</div>
          </GlassCard>
        </>
      ) : (
        <DataTable
          columns={["Tenant", "Plan", "Status", "Users", "Token Usage", "Actions"]}
          rows={tenants.map((t) => {
            const row = dashboardRowsByTenantId.get(t.id_internal);
            return [
            <span key="n" className="font-medium">{t.name}</span>,
            <span key="p" className="text-foreground/80">{row?.plan ?? "-"}</span>,
            <StatusBadge key="s" status={row?.status ?? "active"} />,
            <span key="u" className="tabular-nums">{(row?.users ?? 0).toLocaleString()}</span>,
            <span key="t" className="tabular-nums text-foreground/80">{row?.token_usage ?? "-"}</span>,
            <div key="a" className="flex items-center gap-2">
              <ActionButton variant="outline" onClick={() => onEditTenant(t)}>
                Edit
              </ActionButton>
              <ActionButton
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => onDeleteTenant(t)}
              >
                Delete
              </ActionButton>
            </div>,
          ];
          })}
        />
      )}
    </div>
  );
}
