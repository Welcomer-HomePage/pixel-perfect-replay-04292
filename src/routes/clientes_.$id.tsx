import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { AppShell, EstadoBadge, Migas } from "@/components/AppShell";
import { InteraccionPanel } from "@/components/InteraccionPanel";
import { FUENTES, clienteDe, cop, etapaDe, opDe, pqrVencidosDe, useDb } from "@/lib/data";

export const Route = createFileRoute("/clientes_/$id")({
  head: () => ({
    meta: [
      { title: "Vista 360° del cliente · TCI" },
      { name: "description", content: "Oportunidades, proyectos, PQR, interacciones, pendientes e histórico del cliente." },
      { property: "og:title", content: "Vista 360° del cliente · TCI" },
      { property: "og:description", content: "Toda la información del cliente en un solo lugar." },
    ],
  }),
  component: Vista360,
});

const TABS = ["Resumen", "Oportunidades", "Interacciones", "PQR", "Pendientes", "Histórico"] as const;

function Vista360() {
  const { id } = Route.useParams();
  const db = useDb();
  const c = clienteDe(db, id);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Resumen");
  const [panel, setPanel] = useState(false);
  if (!c) throw notFound();

  const ops = db.oportunidades.filter((o) => o.clienteId === c.id);
  const interacciones = db.interacciones.filter((i) => i.clienteId === c.id);
  const pendientes = db.pendientes.filter((p) => p.clienteId === c.id);
  const pqr = db.pqr.filter((p) => p.clienteId === c.id);
  const vencidos = pqrVencidosDe(db, c.id);

  return (
    <AppShell>
      <Migas items={[{ label: "Tablero", to: "/" }, { label: "Clientes", to: "/clientes" }, { label: c.nombre }]} />

      <div className="rounded-xl border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl font-bold text-wine">{c.nombre}</h1>
              <EstadoBadge estado={c.estado} />
            </div>
            <p className="text-muted-foreground">NIT {c.nit} · {c.tipo}</p>
          </div>
          <button onClick={() => setPanel(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-wine">
            <MessageSquarePlus className="h-4 w-4" /> Registrar interacción
          </button>
        </div>
        {vencidos.length > 0 && (
          <p className="mt-3 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground">
            ⚠ {vencidos.length} PQR con ANS vencido: {vencidos.map((p) => p.id).join(", ")}
          </p>
        )}
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-4">
          {[["Responsable comercial", c.responsable], ["Líder de proyecto", c.lider], ["Supervisor", c.supervisor], ["Último contacto", c.ultimoContacto]].map(([k, v]) => (
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

      <div className="mt-8 flex gap-1 overflow-x-auto border-b">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap border-b-2 px-4 py-2 font-display text-sm font-bold uppercase tracking-wider ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{t}</button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "Resumen" && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Proyectos">
              {c.proyectos.length === 0 && <p className="text-sm text-muted-foreground">Sin proyectos aún.</p>}
              {c.proyectos.map((p) => <Row key={p.nombre} a={p.nombre} b={p.estado} />)}
            </Card>
            <Card title="Última interacción">
              {interacciones[0] ? <><p className="font-semibold">{interacciones[0].tipo} · {interacciones[0].fecha.split("-").reverse().join("/")}</p><p className="mt-1 text-sm text-muted-foreground">{interacciones[0].descripcion}</p></> : <p className="text-muted-foreground">Sin interacciones</p>}
            </Card>
            <Card title="PQR">
              <div className="flex gap-8"><Stat n={pqr.filter((p) => p.estado !== "Cerrada").length} l="Abiertas" /><Stat n={pqr.filter((p) => p.estado === "Cerrada").length} l="Cerradas" /></div>
            </Card>
            <Card title="Próximos compromisos">
              {pendientes.map((p) => <Row key={p.id} a={p.texto} b={p.fecha} />)}
              {pendientes.length === 0 && <p className="text-sm text-muted-foreground">Sin pendientes.</p>}
            </Card>
          </div>
        )}
        {tab === "Oportunidades" && (
          <Card title="Oportunidades de este cliente">
            {ops.length === 0 && <p className="text-sm text-muted-foreground">Sin oportunidades registradas.</p>}
            {ops.map((o) => (
              <Link key={o.id} to="/oportunidades/$id" params={{ id: o.id }} search={{ paso: undefined }} className="flex items-center justify-between gap-4 border-b py-3 last:border-0 hover:text-primary">
                <div>
                  <p className="font-semibold">{o.proceso}</p>
                  <p className="text-sm text-muted-foreground">{cop(o.valor)} · {o.responsable}</p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">Etapa {etapaDe(o.estado)} · {o.estado}</span>
              </Link>
            ))}
          </Card>
        )}
        {tab === "Interacciones" && (
          <Card title="Interacciones registradas">
            {interacciones.length === 0 && <p className="text-sm text-muted-foreground">Sin interacciones.</p>}
            {interacciones.map((i) => {
              const o = i.oportunidadId ? opDe(db, i.oportunidadId) : undefined;
              return (
                <div key={i.id} className="border-b py-3 last:border-0">
                  <p className="font-semibold">{i.tipo} · {i.fecha.split("-").reverse().join("/")} · {i.responsable}</p>
                  {o && <Link to="/oportunidades/$id" params={{ id: o.id }} search={{ paso: undefined }} className="text-xs font-semibold text-primary hover:underline">Oportunidad: {o.proceso} →</Link>}
                  {i.participantes && <p className="text-sm text-muted-foreground">Participantes: {i.participantes}</p>}
                  <p className="mt-1 text-sm">{i.descripcion}</p>
                </div>
              );
            })}
          </Card>
        )}
        {tab === "PQR" && (
          <Card title="Peticiones, quejas y reclamos">
            {pqr.length === 0 && <p className="text-sm text-muted-foreground">Sin PQR.</p>}
            {pqr.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4 border-b py-2 text-sm last:border-0">
                <div>
                  <p className="font-medium">{p.id} · {p.asunto}</p>
                  <p className="text-xs text-muted-foreground">Fuente: {p.fuente}</p>
                </div>
                <div className="text-right">
                  <p>{p.estado}</p>
                  <p className={`text-xs font-semibold ${p.ans === "Vencido" ? "text-destructive" : "text-muted-foreground"}`}>ANS: {p.ans}</p>
                </div>
              </div>
            ))}
          </Card>
        )}
        {tab === "Pendientes" && (
          <Card title="Pendientes">
            {pendientes.length === 0 && <p className="text-sm text-muted-foreground">Sin pendientes.</p>}
            {pendientes.map((p) => {
              const o = p.oportunidadId ? opDe(db, p.oportunidadId) : undefined;
              return (
                <div key={p.id} className="border-b py-2 text-sm last:border-0">
                  <div className="flex justify-between gap-4"><span className="font-medium">{p.texto}</span><span className="text-muted-foreground">{p.fecha}</span></div>
                  {o && <Link to="/oportunidades/$id" params={{ id: o.id }} search={{ paso: 4 }} className="text-xs font-semibold text-primary hover:underline">Vinculado a: {o.proceso} →</Link>}
                </div>
              );
            })}
          </Card>
        )}
        {tab === "Histórico" && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Equipo que intervino">
              {c.equipo.map((e) => <Row key={e.nombre} a={e.nombre} b={e.perfil} />)}
            </Card>
            <Card title="Líneas de negocio para ofrecer">
              <div className="flex flex-wrap gap-2">{c.lineas.map((l) => <span key={l} className="rounded-full border border-primary px-3 py-1 text-sm font-medium text-primary">{l}</span>)}</div>
            </Card>
            <Card title="Proyectos previos (alimenta la evaluación)">
              {c.proyectos.map((p) => <Row key={p.nombre} a={p.nombre} b={p.estado} />)}
              <Row a="Costo histórico" b={c.costo} />
              <Row a="Utilidad histórica" b={c.utilidad} />
            </Card>
          </div>
        )}
      </div>
      <InteraccionPanel abierto={panel} onCerrar={() => setPanel(false)} clienteId={c.id} />
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
