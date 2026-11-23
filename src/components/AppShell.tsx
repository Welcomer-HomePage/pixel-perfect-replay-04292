import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Bell, MessageSquarePlus, LogOut } from "lucide-react";
import { ROLES, useRol, marcarNotificacionesLeidas, type Rol } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { useSession, useVisibleDb, isAdmin, viewAs, logout } from "@/lib/auth";
import { InteraccionPanel } from "@/components/InteraccionPanel";

export function AppShell({ children }: { children: ReactNode }) {
  const rol = useRol();
  const db = useVisibleDb();
  const session = useSession();
  const admin = isAdmin(session);
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
          <nav className="flex flex-wrap gap-1">
            {rol !== "Recursos Humanos" && <>
            <Link to="/" className={nav} activeOptions={{ exact: true }} activeProps={{ className: "bg-wine text-primary-foreground" }}>Tablero</Link>
            <Link to="/mi-bandeja" className={nav} activeProps={{ className: "bg-wine text-primary-foreground" }}>Mi bandeja</Link>
            <Link to="/clientes" className={nav} activeProps={{ className: "bg-wine text-primary-foreground" }}>Clientes</Link>
            <Link to="/integraciones" className={nav} activeProps={{ className: "bg-wine text-primary-foreground" }}>Integraciones</Link>
            <Link to="/api" className={nav} activeProps={{ className: "bg-wine text-primary-foreground" }}>API</Link>
            <Link to="/experiencia" className={nav} activeProps={{ className: "bg-wine text-primary-foreground" }}>Experiencia</Link>
            </>}
            {rol === "Recursos Humanos" && <Link to="/mi-bandeja" className={nav}>Equipo</Link>}
            {admin && <Link to="/datos" className={nav} activeProps={{ className: "bg-wine text-primary-foreground" }}>Cargar datos</Link>}
          </nav>
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            {rol !== "Recursos Humanos" && db.clientes.length > 0 && <Button variant="ghost" onClick={() => setPanel(true)} className="inline-flex items-center gap-2 rounded-md bg-wine px-3 py-2 text-sm font-semibold hover:opacity-90">
              <MessageSquarePlus className="h-4 w-4" /> Registrar interacción
            </Button>}
            <div className="relative">
              <Button variant="ghost" aria-label="Notificaciones" onClick={() => { setCampana((v) => !v); if (!campana) marcarNotificacionesLeidas(rol); }} className="relative rounded-md p-2 hover:bg-wine">
                <Bell className="h-5 w-5" />
                {pendientes.length > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-warning text-[10px] font-bold text-warning-foreground">{pendientes.length}</span>}
              </Button>
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
            {admin && <label className="flex items-center gap-2 text-sm font-semibold">
              <span>Ver como</span>
              <select aria-label="Ver como" value={session?.viewAs} onChange={(e) => viewAs(e.target.value as Rol)} className="max-w-52 rounded-md bg-primary-foreground px-2 py-1.5 text-primary">
                <option>Administrador</option>{ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>}
            <Button variant="ghost" onClick={()=>logout()} className="text-primary-foreground hover:bg-wine hover:text-primary-foreground"><LogOut className="h-4 w-4"/>Cerrar sesión · {session?.nombre}</Button>
          </div>
        </div>
      </header>
      <div className="border-b bg-muted"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-6 py-3">
        <p className="min-w-0 break-words text-xs font-semibold text-muted-foreground">Datos: {db.origen.archivo} · {db.origen.fecha ? new Date(db.origen.fecha).toLocaleDateString("es-CO") : "—"} · {db.clientes.length} clientes · {db.proyectos.length} proyectos · {db.oportunidades.length} oportunidades</p><span className="text-xs font-bold text-primary">Simulado</span>
      </div></div>
      {admin && session?.viewAs!=="Administrador" && <div className="border-b bg-warning-soft"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-2"><p className="text-sm font-semibold text-warning-foreground">Viendo como: {session?.viewAs}</p><Button variant="outline" size="sm" onClick={()=>viewAs("Administrador")}>Volver a Administrador</Button></div></div>}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
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
