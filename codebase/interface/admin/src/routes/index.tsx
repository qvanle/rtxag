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
  const tenantsQuery = useAdminQuery(["dashboard", "tenants"], () =>
    adminApi.dashboardTenants(),
  );
  const createTenant = useAdminMutation(adminApi.createTenant);

  if (globalQuery.isLoading || tenantsQuery.isLoading) {
    return <div className="text-sm text-muted-foreground">Loading dashboard...</div>;
  }

  if (globalQuery.error || tenantsQuery.error) {
    return (
      <div className="text-sm text-destructive">
        {(globalQuery.error as Error | undefined)?.message ??
          (tenantsQuery.error as Error | undefined)?.message ??
          "Failed to load dashboard"}
      </div>
    );
  }

  const global = globalQuery.data;
  const tenants = tenantsQuery.data ?? [];

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="System observability across global infrastructure and tenant operations."
        actions={
          <>
            <ScopeSwitcher value={scope} onChange={setScope} />
            <ActionButton variant="outline" onClick={() => setIsAddingTenant((v) => !v)}>
              Add tenant
            </ActionButton>
          </>
        }
      />

      {isAddingTenant && (
        <GlassCard className="space-y-3">
          <div className="text-sm font-semibold">Add tenant</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
            <ActionButton onClick={onSubmitTenant} disabled={createTenant.isPending}>
              {createTenant.isPending ? "Creating..." : "Create"}
            </ActionButton>
          </div>
          {!!createTenant.error && (
            <div className="text-sm text-destructive">{(createTenant.error as Error).message}</div>
          )}
        </GlassCard>
      )}

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
          columns={["Tenant", "Plan", "Status", "Users", "Token Usage"]}
          rows={tenants.map((t) => [
            <span key="n" className="font-medium">{t.tenant_name}</span>,
            <span key="p" className="text-foreground/80">{t.plan}</span>,
            <StatusBadge key="s" status={t.status} />,
            <span key="u" className="tabular-nums">{t.users.toLocaleString()}</span>,
            <span key="t" className="tabular-nums text-foreground/80">{t.token_usage}</span>,
          ])}
        />
      )}
    </div>
  );
}
