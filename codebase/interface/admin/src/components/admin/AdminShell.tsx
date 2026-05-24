import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Bot,
  Cpu,
  Database,
  Plug,
  Search,
  Bell,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/assistant", label: "Assistant", icon: Bot },
  { to: "/model", label: "Model", icon: Cpu },
  { to: "/retrieval", label: "Retrieval", icon: Database },
  { to: "/mcp", label: "MCP", icon: Plug },
];

export function AdminShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const auroraRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const speed = 5; // px/s
    const blobs = auroraRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!blobs.length) return;

    const randomUnitVector = () => {
      const angle = Math.random() * Math.PI * 2;
      return { vx: Math.cos(angle), vy: Math.sin(angle) };
    };

    const states = blobs.map((el, index) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const starts = [{ x: w * 0.2, y: h * 0.16 }, { x: w * 0.82, y: h * 0.42 }, { x: w * 0.52, y: h * 0.82 }];
      const dir = randomUnitVector();
      const start = starts[index] ?? { x: w * Math.random(), y: h * Math.random() };
      return { el, x: start.x, y: start.y, vx: dir.vx, vy: dir.vy };
    });

    const place = (s: (typeof states)[number]) => {
      s.el.style.left = `${s.x}px`;
      s.el.style.top = `${s.y}px`;
      s.el.style.right = "auto";
      s.el.style.bottom = "auto";
      s.el.style.transform = "translate(-50%, -50%)";
    };
    states.forEach(place);

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const w = window.innerWidth;
      const h = window.innerHeight;

      for (const s of states) {
        s.x += s.vx * speed * dt;
        s.y += s.vy * speed * dt;

        if (s.x <= 0) {
          s.x = 0;
          s.vx = Math.abs(s.vx);
        } else if (s.x >= w) {
          s.x = w;
          s.vx = -Math.abs(s.vx);
        }

        if (s.y <= 0) {
          s.y = 0;
          s.vy = Math.abs(s.vy);
        } else if (s.y >= h) {
          s.y = h;
          s.vy = -Math.abs(s.vy);
        }

        place(s);
      }

      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Aurora background blobs */}
      <div
        ref={(el) => {
          auroraRefs.current[0] = el;
        }}
        className="aurora-blob"
        style={{ background: "var(--color-aurora-1)", width: 520, height: 520, top: -160, left: -120 }}
      />
      <div
        ref={(el) => {
          auroraRefs.current[1] = el;
        }}
        className="aurora-blob"
        style={{ background: "var(--color-aurora-2)", width: 480, height: 480, top: 240, right: -160 }}
      />
      <div
        ref={(el) => {
          auroraRefs.current[2] = el;
        }}
        className="aurora-blob"
        style={{ background: "var(--color-aurora-3)", width: 420, height: 420, bottom: -180, left: "40%" }}
      />

      <div className="relative flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-glass-border glass-strong">
          <div className="flex h-16 items-center gap-2 px-5 border-b border-glass-border">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Aurora Admin</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Platform Console
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {nav.map((item) => {
              const active =
                item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    active
                      ? "bg-gradient-primary text-primary-foreground shadow-glow"
                      : "text-sidebar-foreground/80",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="m-3 rounded-xl glass p-4">
            <div className="text-xs text-muted-foreground">System status</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              <span className="text-sm font-medium">All systems operational</span>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-16 shrink-0 border-b border-glass-border glass-strong px-4 md:px-6 flex items-center gap-4">
            <div className="md:hidden flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-gradient-primary grid place-items-center">
                <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm">Aurora</span>
            </div>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search tenants, assistants, models…"
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/40 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
              />
            </div>

            <div className="ml-auto flex items-center gap-3">
              <button className="relative h-9 w-9 grid place-items-center rounded-lg glass hover:bg-accent transition">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-warning" />
              </button>
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-glass-border">
                <div className="h-8 w-8 rounded-full bg-gradient-primary grid place-items-center text-xs font-semibold text-primary-foreground">
                  SA
                </div>
                <div className="text-xs leading-tight">
                  <div className="font-medium">System Admin</div>
                  <div className="text-muted-foreground">admin@aurora.io</div>
                </div>
              </div>
            </div>
          </header>

          {/* Mobile nav */}
          <div className="md:hidden flex gap-1 overflow-x-auto px-3 py-2 border-b border-glass-border glass-strong">
            {nav.map((item) => {
              const active =
                item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs whitespace-nowrap",
                    active ? "bg-gradient-primary text-primary-foreground" : "text-foreground/70",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <main className="relative z-0 flex-1 p-4 md:p-8 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
