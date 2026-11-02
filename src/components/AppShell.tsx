import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const nav = "px-3 py-2 rounded-md text-sm font-semibold uppercase tracking-wider text-primary-foreground/80 hover:text-primary-foreground";
  return (
    <div className="min-h-screen">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="rounded-md bg-primary-foreground px-2 py-1 font-display text-xl font-extrabold text-primary">TCI</span>
            <span className="font-display text-lg font-bold uppercase tracking-widest">Gestión de Clientes</span>
          </Link>
          <nav className="flex gap-1">
            <Link to="/" className={nav} activeOptions={{ exact: true }} activeProps={{ className: "bg-wine text-primary-foreground" }}>Clientes</Link>
            <Link to="/seguimiento" className={nav} activeProps={{ className: "bg-wine text-primary-foreground" }}>Seguimiento</Link>
            <Link to="/licitaciones" className={nav} activeProps={{ className: "bg-wine text-primary-foreground" }}>Licitaciones</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

export function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    Activo: "bg-success-soft text-success",
    "En seguimiento": "bg-warning-soft text-warning-foreground",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[estado] ?? "bg-secondary text-secondary-foreground"}`}>{estado}</span>;
}
