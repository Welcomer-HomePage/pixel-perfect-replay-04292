import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Bell, MessageSquarePlus } from "lucide-react";
import { ROLES, setRol, useDb, useRol, marcarNotificacionesLeidas, type Rol } from "@/lib/data";
import { InteraccionPanel } from "@/components/InteraccionPanel";

export function AppShell({ children }: { children: ReactNode }) {
  const rol = useRol();
  const db = useDb();
  const [panel, setPanel] = useState(false);
  const [campana, setCampana] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const nav = "px-3 py-2 rounded-md text-sm font-semibold uppercase tracking-wider text-primary-foreground/80 hover:text-primary-foreground";
  const pendientes = db.notificaciones.filter((n) => n.rol === rol && !n.leida);

  return (
    <div className="min-h-screen">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="rounded-md bg-primary-foreground px-2 py-1 font-display text-xl font-extrabold text-primary">TCI</span>
            <span className="font-display text-lg font-bold uppercase tracking-widest">Gestión de Clientes</span>
          </Link>
          <nav className="flex gap-1">
            <Link to="/" className={nav} activeOptions={{ exact: true }} activeProps={{ className: "bg-wine text-primary-foreground" }}>Tablero</Link>
            <Link to="/mi-bandeja" className={nav} activeProps={{ className: "bg-wine text-primary-foreground" }}>Mi bandeja</Link>
            <Link to="/clientes" className={nav} activeProps={{ className: "bg-wine text-primary-foreground" }}>Clientes</Link>
            <Link to="/integraciones" className={nav} activeProps={{ className: "bg-wine text-primary-foreground" }}>Integraciones</Link>
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={() => setPanel(true)} className="inline-flex items-center gap-2 rounded-md bg-wine px-3 py-2 text-sm font-semibold hover:opacity-90">
              <MessageSquarePlus className="h-4 w-4" /> Registrar interacción
            </button>
            <div className="relative">
              <button aria-label="Notificaciones" onClick={() => { setCampana((v) => !v); if (!campana) marcarNotificacionesLeidas(rol); }} className="relative rounded-md p-2 hover:bg-wine">
                <Bell className="h-5 w-5" />
                {pendientes.length > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-warning text-[10px] font-bold text-warning-foreground">{pendientes.length}</span>}
              </button>
              {campana && (
                <div className="absolute right-0 z-40 mt-2 w-80 rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg">
                  <p className="section-title mb-2">Notificaciones · {rol}</p>
                  {db.notificaciones.filter((n) => n.rol === rol).length === 0 && <p className="text-sm text-muted-foreground">No hay notificaciones para tu rol.</p>}
                  {db.notificaciones.filter((n) => n.rol === rol).map((n) => (
                    <Link key={n.id} to="/oportunidades/$id" params={{ id: n.oportunidadId }} search={{ paso: n.paso }} onClick={() => setCampana(false)} className="block rounded-md px-2 py-2 text-sm hover:bg-accent">
                      {n.texto}
                      <span className="block text-xs text-muted-foreground">Ir al paso {n.paso} →</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <span className="uppercase tracking-wider text-primary-foreground/80">Rol</span>
              <select aria-label="Rol" value={rol} onChange={(e) => setRol(e.target.value as Rol)} className="rounded-md bg-primary-foreground px-2 py-1.5 text-primary">
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      <InteraccionPanel abierto={panel} onCerrar={() => setPanel(false)} key={pathname} />
    </div>
  );
}

export function Migas({ items }: { items: { label: string; to?: string; params?: Record<string, string> }[] }) {
  return (
    <nav aria-label="Ruta de migas" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span>›</span>}
          {it.to
            ? <Link to={it.to} {...(it.params ? { params: it.params } : {})} className="text-primary hover:underline">{it.label}</Link>
            : <span className="font-semibold text-foreground">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    Activo: "bg-success-soft text-success",
    "En seguimiento": "bg-warning-soft text-warning-foreground",
    Ganada: "bg-success-soft text-success",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[estado] ?? "bg-secondary text-secondary-foreground"}`}>{estado}</span>;
}
