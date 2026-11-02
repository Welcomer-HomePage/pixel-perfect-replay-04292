import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Plus, ChevronRight } from "lucide-react";
import { AppShell, EstadoBadge } from "@/components/AppShell";
import { useClientes } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Búsqueda de clientes · TCI Gestión de Clientes" },
      { name: "description", content: "Busca clientes de TCI Software por nombre o NIT y accede a su vista 360°." },
      { property: "og:title", content: "Búsqueda de clientes · TCI" },
      { property: "og:description", content: "Busca clientes por nombre o NIT." },
    ],
  }),
  component: Index,
});

function Index() {
  const clientes = useClientes();
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("");
  const norm = (s: string) => s.toLowerCase().replace(/\./g, "");
  const lista = clientes.filter((c) => !filtro || norm(c.nombre).includes(norm(filtro)) || norm(c.nit).includes(norm(filtro)));

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-wine">Búsqueda de cliente</h1>
          <p className="text-muted-foreground">Encuentra un cliente por nombre o NIT.</p>
        </div>
        <Link to="/seguimiento" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 font-semibold text-primary-foreground hover:bg-wine">
          <Plus className="h-4 w-4" /> Registrar nueva interacción
        </Link>
      </div>

      <form className="mt-6 flex gap-2" onSubmit={(e) => { e.preventDefault(); setFiltro(q); }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input className="field pl-9" placeholder="Nombre o NIT del cliente" value={q} onChange={(e) => { setQ(e.target.value); if (!e.target.value) setFiltro(""); }} />
        </div>
        <button className="rounded-md bg-primary px-6 font-semibold text-primary-foreground hover:bg-wine">Buscar</button>
      </form>

      <h2 className="section-title mt-10">Clientes recientes</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {clientes.slice(0, 2).map((c) => (
          <Link key={c.id} to="/clientes/$id" params={{ id: c.id }} className="rounded-xl border bg-card p-5 transition hover:border-primary hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="font-display text-xl font-bold">{c.nombre}</span>
              <EstadoBadge estado={c.estado} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">NIT {c.nit}</p>
          </Link>
        ))}
      </div>

      <h2 className="section-title mt-10">Todos los clientes</h2>
      <div className="mt-3 divide-y rounded-xl border">
        {lista.length === 0 && <p className="p-5 text-muted-foreground">No se encontraron clientes para “{filtro}”.</p>}
        {lista.map((c) => (
          <Link key={c.id} to="/clientes/$id" params={{ id: c.id }} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-card">
            <div>
              <p className="font-semibold">{c.nombre}</p>
              <p className="text-sm text-muted-foreground">NIT {c.nit}</p>
            </div>
            <div className="flex items-center gap-3"><EstadoBadge estado={c.estado} /><ChevronRight className="h-4 w-4 text-muted-foreground" /></div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
