import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  GlassCard,
  PageHeader,
  ScopeSwitcher,
  StatusBadge,
  DataTable,
} from "@/components/admin/primitives";
import { kpis, tenants, trafficSeries } from "@/lib/mock-data";
import { Activity, DollarSign, AlertTriangle, Gauge, ArrowUpRight, ArrowDownRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function KpiTile({
  icon: Icon,
  label,
  value,
  delta,
  positive,
}: {
  icon: any;
  label: string;
  value: string;
  delta: string;
  positive: boolean;
}) {
  return (
    <GlassCard>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
        </div>
        <div className="h-10 w-10 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs">
        {positive ? (
          <ArrowUpRight className="h-3.5 w-3.5 text-success" />
        ) : (
          <ArrowDownRight className="h-3.5 w-3.5 text-success" />
        )}
        <span className="text-success font-medium">{delta}</span>
        <span className="text-muted-foreground">vs last 7d</span>
      </div>
    </GlassCard>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const w = 100;
  const h = 40;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min)) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.7 0.18 255)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="oklch(0.7 0.18 255)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={`0,${h} ${points} ${w},${h}`}
        fill="url(#sg)"
        stroke="none"
      />
      <polyline
        points={points}
        fill="none"
        stroke="oklch(0.75 0.18 255)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Dashboard() {
  const [scope, setScope] = useState<"global" | "tenant">("global");

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
            <KpiTile icon={Activity} label="Token consumption" value={kpis.tokens.value} delta={kpis.tokens.delta} positive />
            <KpiTile icon={DollarSign} label="Cost (MTD)" value={kpis.cost.value} delta={kpis.cost.delta} positive />
            <KpiTile icon={AlertTriangle} label="Error rate" value={kpis.errorRate.value} delta={kpis.errorRate.delta} positive={false} />
            <KpiTile icon={Gauge} label="P50 latency" value={kpis.latency.value} delta={kpis.latency.delta} positive={false} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <GlassCard className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-semibold">Traffic (24h)</div>
                  <div className="text-xs text-muted-foreground">Requests per hour</div>
                </div>
                <div className="text-xs text-muted-foreground">62.4M tokens</div>
              </div>
              <Sparkline data={trafficSeries} />
            </GlassCard>

            <GlassCard>
              <div className="text-sm font-semibold mb-3">System health</div>
              <div className="space-y-3">
                {[
                  { label: "API Gateway", value: 99.99 },
                  { label: "Inference Pool", value: 99.92 },
                  { label: "Vector Store", value: 99.87 },
                  { label: "MCP Bridge", value: 99.71 },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground/80">{row.label}</span>
                      <span className="text-success font-medium">{row.value}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-gradient-primary"
                        style={{ width: `${row.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </>
      ) : (
        <DataTable
          columns={["Tenant", "Plan", "Status", "Users", "Tokens"]}
          rows={tenants.map((t) => [
            <div key="n" className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center text-xs font-semibold text-primary-foreground">
                {t.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="font-medium">{t.name}</span>
            </div>,
            <span key="p" className="text-foreground/80">{t.plan}</span>,
            <StatusBadge key="s" status={t.status} />,
            <span key="u" className="tabular-nums">{t.users.toLocaleString()}</span>,
            <span key="t" className="tabular-nums text-foreground/80">
              {(t.tokens / 1_000_000).toFixed(2)}M
            </span>,
          ])}
        />
      )}
    </div>
  );
}
