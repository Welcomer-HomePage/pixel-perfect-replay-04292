import { EmptyData } from "@/components/EmptyData";
import { Button } from "@/components/ui/button";
import { useVisibleDb, useSession, isAdmin } from "@/lib/auth";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ChevronRight } from "lucide-react";
import { AppShell, EstadoBadge, Migas } from "@/components/AppShell";
import { useDb } from "@/lib/data";

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes · TCI Gestión de Clientes" },
      { name: "description", content: "Busca clientes de TCI Software por nombre o NIT y accede a su Vista 360°." },
      { property: "og:title", content: "Clientes · TCI" },
      { property: "og:description", content: "Busca clientes por nombre o NIT." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Clientes,
});

function Clientes() {
  const db = useVisibleDb();
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("");
  const norm = (s: string) => s.toLowerCase().replace(/\./g, "");
  const lista = db.clientes.filter((c) => !filtro || norm(c.nombre).includes(norm(filtro)) || norm(c.nit).includes(norm(filtro)));

  return (
    <AppShell>
      <Migas items={[{ label: "Tablero", to: "/" }, { label: "Clientes" }]} />
      <h1 className="font-display text-3xl font-bold uppercase tracking-normal text-wine">Clientes</h1>
      <p className="text-muted-foreground">Encuentra un cliente por nombre o NIT y abre su Vista 360°.</p>

      {!db.clientes.length && <div className="mt-6"><EmptyData/></div>}
      <form className="mt-6 flex gap-2" onSubmit={(e) => { e.preventDefault(); setFiltro(q); }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input className="field pl-9" placeholder="Nombre o NIT del cliente" value={q} onChange={(e) => { setQ(e.target.value); if (!e.target.value) setFiltro(""); }} />
        </div>
        <Button variant="ghost" className="rounded-md bg-primary px-6 font-semibold text-primary-foreground hover:bg-wine">Buscar</Button>
      </form>

      <div className="mt-6 divide-y rounded-xl border bg-card">
        {lista.length === 0 && <p className="p-5 text-muted-foreground">No se encontraron clientes para “{filtro}”.</p>}
        {lista.map((c) => (
          <Link key={c.id} to="/clientes/$id" params={{ id: c.id }} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-accent">
            <div>
              <p className="font-semibold">{c.nombre}</p>
              <p className="text-sm text-muted-foreground">NIT {c.nit} · {c.tipo}</p>
            </div>
            <div className="flex items-center gap-3"><EstadoBadge estado={c.estado} /><ChevronRight className="h-4 w-4 text-muted-foreground" /></div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
