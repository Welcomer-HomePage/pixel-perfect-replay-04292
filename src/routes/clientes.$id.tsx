import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, FolderPlus, LineChart, MessageSquarePlus } from "lucide-react";
import { AppShell, EstadoBadge } from "@/components/AppShell";
import { useClientes, FUENTES } from "@/lib/data";

export const Route = createFileRoute("/clientes/$id")({
  head: () => ({
    meta: [
      { title: "Vista 360° del cliente · TCI" },
      { name: "description", content: "Resumen, histórico, interacciones, PQR y pendientes del cliente." },
      { property: "og:title", content: "Vista 360° del cliente · TCI" },
      { property: "og:description", content: "Toda la información del cliente en un solo lugar." },
    ],
  }),
  component: Vista360,
});

const TABS = ["Resumen", "Histórico", "Interacciones", "PQR", "Pendientes"] as const;

function Vista360() {
  const { id } = Route.useParams();
  const c = useClientes().find((x) => x.id === id);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Resumen");
  if (!c) throw notFound();
  const btn = "inline-flex items-center gap-2 rounded-md px-4 py-2 font-semibold";

  return (
    <AppShell>
      <Link to="/" className="text-sm text-primary hover:underline">← Volver a clientes</Link>
      <div className="mt-3 rounded-xl border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl font-bold text-wine">{c.nombre}</h1>
              <EstadoBadge estado={c.estado} />
            </div>
            <p className="text-muted-foreground">NIT {c.nit}</p>
          </div>
          <button onClick={() => toast.info("Edición de cliente disponible próximamente")} className={`${btn} border border-primary text-primary hover:bg-accent`}>
            <Pencil className="h-4 w-4" /> Editar cliente
          </button>
        </div>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
          {[["Responsable comercial", c.responsable], ["Líder de proyecto", c.lider], ["Último contacto", c.ultimoContacto]].map(([k, v]) => (
            <div key={k}><dt className="section-title text-xs">{k}</dt><dd className="mt-1 font-medium">{v}</dd></div>
          ))}
        </dl>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[["Costo del proyecto", c.costo], ["Utilidad", c.utilidad], ["Proyectos históricos", String(c.historicos)]].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-primary p-5 text-primary-foreground">
            <p className="font-display text-sm uppercase tracking-widest opacity-80">{k}</p>
            <p className="mt-1 font-display text-4xl font-bold">{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border bg-card p-5">
        <h3 className="section-title mb-3">Fuentes de datos</h3>
        <div className="flex flex-wrap gap-3">
          {FUENTES.map((f) => (
            <div key={f.nombre} className="rounded-lg border border-primary px-3 py-2">
              <p className="text-sm font-bold text-primary">{f.nombre}</p>
              <p className="text-xs text-muted-foreground">Última sincronización: {f.sync}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={() => toast.success("Proyecto creado (simulado)")} className={`${btn} bg-secondary text-secondary-foreground hover:bg-accent`}><FolderPlus className="h-4 w-4" /> Crear proyecto</button>
        <button onClick={() => toast.success("Estudio de mercado solicitado (simulado)")} className={`${btn} bg-secondary text-secondary-foreground hover:bg-accent`}><LineChart className="h-4 w-4" /> Estudio de mercado</button>
        <Link to="/seguimiento" search={{ cliente: c.id }} className={`${btn} bg-primary text-primary-foreground hover:bg-wine`}><MessageSquarePlus className="h-4 w-4" /> Registrar interacción</Link>
      </div>

      <div className="mt-8 flex gap-1 overflow-x-auto border-b">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap border-b-2 px-4 py-2 font-display text-sm font-bold uppercase tracking-wider ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{t}</button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "Resumen" && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Proyectos activos">
              {c.proyectos.map((p) => <Row key={p.nombre} a={p.nombre} b={p.estado} />)}
            </Card>
            <Card title="Última interacción">
              {c.interacciones[0] ? <><p className="font-semibold">{c.interacciones[0].tipo} · {c.interacciones[0].fecha.split("-").reverse().join("/")}</p><p className="mt-1 text-sm text-muted-foreground">{c.interacciones[0].descripcion}</p></> : <p className="text-muted-foreground">Sin interacciones</p>}
            </Card>
            <Card title="PQR">
              <div className="flex gap-8"><Stat n={c.pqr.abiertas} l="Abiertas" /><Stat n={c.pqr.cerradas} l="Cerradas" /></div>
            </Card>
            <Card title="Próximos compromisos">
              {c.pendientes.map((p, i) => <Row key={i} a={p.texto} b={p.fecha} />)}
            </Card>
          </div>
        )}
        {tab === "Histórico" && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Equipo que intervino">
              {c.equipo.map((e) => <Row key={e.nombre} a={e.nombre} b={e.perfil} />)}
            </Card>
            <Card title="Líneas de negocio para ofrecer">
              <div className="flex flex-wrap gap-2">{c.lineas.map((l) => <span key={l} className="rounded-full border border-primary px-3 py-1 text-sm font-medium text-primary">{l}</span>)}</div>
            </Card>
          </div>
        )}
        {tab === "Interacciones" && (
          <Card title="Interacciones registradas">
            {c.interacciones.map((i) => (
              <div key={i.id} className="border-b py-3 last:border-0">
                <p className="font-semibold">{i.tipo} · {i.fecha.split("-").reverse().join("/")} · {i.responsable}</p>
                {i.participantes && <p className="text-sm text-muted-foreground">Participantes: {i.participantes}</p>}
                <p className="mt-1 text-sm">{i.descripcion}</p>
              </div>
            ))}
          </Card>
        )}
        {tab === "PQR" && (
          <Card title="Peticiones, quejas y reclamos">
            <div className="flex gap-8"><Stat n={c.pqr.abiertas} l="Abiertas" /><Stat n={c.pqr.cerradas} l="Cerradas" /></div>
            <Row a="PQR-0142 · Demora en respuesta de mesa de ayuda" b="Abierta" />
            <Row a="PQR-0137 · Ajuste en reporte mensual" b="Cerrada" />
          </Card>
        )}
        {tab === "Pendientes" && (
          <Card title="Pendientes">
            {c.pendientes.map((p, i) => <Row key={i} a={p.texto} b={p.fecha} />)}
          </Card>
        )}
      </div>
    </AppShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-xl border bg-card p-5"><h3 className="section-title mb-3">{title}</h3>{children}</div>;
}
function Row({ a, b }: { a: string; b: string }) {
  return <div className="flex justify-between gap-4 border-b py-2 text-sm last:border-0"><span className="font-medium">{a}</span><span className="text-muted-foreground">{b}</span></div>;
}
function Stat({ n, l }: { n: number; l: string }) {
  return <div><p className="font-display text-3xl font-bold text-primary">{n}</p><p className="text-sm text-muted-foreground">{l}</p></div>;
}
