import { cn } from "@/lib/utils";
import type { ReactNode, HTMLAttributes } from "react";

export function GlassCard({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass rounded-2xl p-5 shadow-elegant transition-all hover:border-primary/30",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gradient">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function ScopeSwitcher({
  value,
  onChange,
}: {
  value: "global" | "tenant";
  onChange: (v: "global" | "tenant") => void;
}) {
  return (
    <div className="inline-flex p-1 rounded-lg glass border border-glass-border">
      {(["global", "tenant"] as const).map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={cn(
            "px-4 py-1.5 text-xs font-medium rounded-md capitalize transition-all",
            value === s
              ? "bg-gradient-primary text-primary-foreground shadow-glow"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {s === "global" ? "Global" : "Per Tenant"}
        </button>
      ))}
    </div>
  );
}

const statusStyles: Record<string, string> = {
  active: "bg-success/15 text-success border-success/30",
  enabled: "bg-success/15 text-success border-success/30",
  indexed: "bg-success/15 text-success border-success/30",
  draft: "bg-warning/15 text-warning border-warning/30",
  indexing: "bg-info/15 text-info border-info/30",
  trial: "bg-info/15 text-info border-info/30",
  deprecated: "bg-muted text-muted-foreground border-border",
  archived: "bg-muted text-muted-foreground border-border",
  disabled: "bg-muted text-muted-foreground border-border",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
  suspended: "bg-destructive/15 text-destructive border-destructive/30",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = statusStyles[status] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize",
        cls,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  );
}

export function ActionButton({
  variant = "primary",
  children,
  className,
  ...props
}: HTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
        variant === "primary" &&
          "bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90",
        variant === "outline" &&
          "border border-glass-border glass hover:bg-accent text-foreground",
        variant === "ghost" && "hover:bg-accent text-foreground/80",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-glass-border glass">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            {columns.map((c) => (
              <th
                key={c}
                className="px-4 py-3 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground border-b border-glass-border"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-glass-border/60 last:border-0 hover:bg-accent/30 transition-colors"
            >
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 align-middle">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
