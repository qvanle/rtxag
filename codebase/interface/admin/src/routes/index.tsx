import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  GlassCard,
  PageHeader,
  ScopeSwitcher,
  StatusBadge,
  DataTable,
} from "@/components/admin/primitives";
import { Activity, DollarSign, AlertTriangle, Gauge } from "lucide-react";
import { adminApi, useAdminQuery } from "@/lib/admin-api";

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
  const globalQuery = useAdminQuery(["dashboard", "global"], adminApi.dashboardGlobal);
  const tenantsQuery = useAdminQuery(["dashboard", "tenants"], () =>
    adminApi.dashboardTenants(),
  );

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="System observability across global infrastructure and tenant operations."
        actions={<ScopeSwitcher value={scope} onChange={setScope} />}
      />

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
