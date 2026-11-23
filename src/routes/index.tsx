import { EmptyData } from "@/components/EmptyData";
import { Button } from "@/components/ui/button";
import { useVisibleDb, useSession, isAdmin } from "@/lib/auth";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { AppShell, Migas } from "@/components/AppShell";
import { ETAPAS, alertasDe, clienteDe, cop, etapaDe, venceHoy, type Oportunidad } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tablero de oportunidades · TCI Gestión de Clientes" },
      { name: "description", content: "Mapa del proceso comercial de TCI: identificar, evaluar, preparar, seguir y ejecutar oportunidades." },
      { property: "og:title", content: "Tablero de oportunidades · TCI" },
      { property: "og:description", content: "Kanban de oportunidades por etapa del proceso comercial." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Tablero,
});

const TIPOS = ["Financiero", "Público", "Mixto", "Privado"];

function Tablero() {
  const db = useVisibleDb();
  const [flt, setFlt] = useState({ entidad: "", tipo: "", fuente: "" });
  const [alerta, setAlerta] = useState("");

  const pasa = (o: Oportunidad) => {
    const c = clienteDe(db, o.clienteId);
    return (!flt.entidad || c?.nombre === flt.entidad)
      && (!flt.tipo || c?.tipo === flt.tipo)
      && (!flt.fuente || o.fuente === flt.fuente);
  };
  const alertas = (o: Oportunidad) => alertasDe(o, db);
  const pasaAlerta = (o: Oportunidad) => !alerta || alertas(o).includes(alerta);
  const lista = db.oportunidades.filter((o) => pasa(o) && pasaAlerta(o));

  const nSinAtender = db.oportunidades.filter((o) => o.estado === "Identificada").length;
  const nVenceHoy = db.oportunidades.filter(venceHoy).length;
  const nPqr = db.oportunidades.filter((o) => alertas(o).includes("PQR con ANS vencido")).length;

  const AlertaBtn = ({ nombre, n }: { nombre: string; n: number }) => (
    <Button variant="ghost" onClick={() => setAlerta((a) => (a === nombre ? "" : nombre))}
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${alerta === nombre ? "border-destructive bg-destructive text-destructive-foreground" : "border-warning bg-warning-soft text-warning-foreground"}`}>
      {nombre}: {n}
    </Button>
  );

  return (
    <AppShell>
      <Migas items={[{ label: "Tablero" }]} />
      <h1 className="font-display text-3xl font-bold uppercase tracking-normal text-wine">Tablero de oportunidades</h1>

      {db.origen.experiencia && !db.oportunidades.length && <p className="mt-4 border-l-4 border-primary bg-accent p-4 text-sm">Cargaste experiencia. Para ver oportunidades, carga la plantilla o usa 'Agregar/actualizar'.</p>}
      {!db.oportunidades.length && <div className="mt-6"><EmptyData/></div>}
      {/* Mapa del proceso */}
      <div className="mt-5 flex flex-wrap items-stretch gap-2">
        {ETAPAS.map((e, i) => (
          <div key={e.n} className="flex items-center gap-2">
            <div className="rounded-xl border bg-card px-4 py-3 text-center">
              <p className="font-display text-sm font-bold uppercase tracking-normal text-primary">{e.n}. {e.nombre}</p>
              <p className="font-display text-2xl font-bold">{db.oportunidades.filter((o) => etapaDe(o.estado) === e.n).length}</p>
            </div>
            {i < ETAPAS.length - 1 && <span className="text-xl text-muted-foreground">→</span>}
          </div>
        ))}
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-primary px-4 py-3 text-sm font-medium text-primary">
          <RotateCcw className="h-4 w-4" /> La ejecución alimenta nuevas evaluaciones
        </div>
      </div>

      {/* Barra de alertas */}
      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-lg border border-warning bg-warning-soft px-4 py-3 text-warning-foreground">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <span className="text-sm font-semibold">Alertas:</span>
        <AlertaBtn nombre="Sin atender" n={nSinAtender} />
        <AlertaBtn nombre="Vence hoy" n={nVenceHoy} />
        <AlertaBtn nombre="PQR con ANS vencido" n={nPqr} />
        {alerta && <Button variant="ghost" onClick={() => setAlerta("")} className="text-xs underline">Quitar filtro</Button>}
      </div>

      {/* Filtros */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <select className="field" value={flt.entidad} onChange={(e) => setFlt({ ...flt, entidad: e.target.value })}>
          <option value="">Entidad: todas</option>
          {db.clientes.map((c) => <option key={c.id}>{c.nombre}</option>)}
        </select>
        <select className="field" value={flt.tipo} onChange={(e) => setFlt({ ...flt, tipo: e.target.value })}>
          <option value="">Tipo de cliente: todos</option>
          {TIPOS.map((x) => <option key={x}>{x}</option>)}
        </select>
        <select className="field" value={flt.fuente} onChange={(e) => setFlt({ ...flt, fuente: e.target.value })}>
          <option value="">Fuente: todas</option>
          {["SECOP II", "Portal propio", "Venta directa", "Otro"].map((x) => <option key={x}>{x}</option>)}
        </select>

      </div>

      {/* Kanban */}
      <div className="mt-6 grid gap-4 overflow-x-auto lg:grid-cols-5">
        {ETAPAS.map((e) => {
          const ops = lista.filter((o) => etapaDe(o.estado) === e.n);
          return (
            <section key={e.n} className="min-w-56 rounded-xl border bg-card p-3">
              <h2 className="section-title mb-3 flex justify-between"><span>{e.n}. {e.nombre}</span><span>{ops.length}</span></h2>
              <div className="space-y-3">
                {ops.map((o) => {
                  const c = clienteDe(db, o.clienteId);
                  const etapa = etapaDe(o.estado);
                  return (
                    <Link key={o.id} to="/oportunidades/$id" params={{ id: o.id }} search={{ paso: undefined }} className="block rounded-lg border bg-background p-3 transition hover:border-primary hover:shadow-md">
                      <p className="text-xs font-semibold text-muted-foreground">{c?.nombre}</p>
                      <p className="font-semibold leading-tight">{o.proceso}</p>
                      <p className="mt-1 font-display text-lg font-bold text-primary">{cop(o.valor)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{o.responsable} · Vence {o.vence.split("-").reverse().join("/")}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">{etapa <= 2 ? "Alivia PP1" : "Alivia PP2"}</span>
                        {alertas(o).map((a) => (
                          <span key={a} className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">{a}</span>
                        ))}
                      </div>
                    </Link>
                  );
                })}
                {ops.length === 0 && <p className="text-xs text-muted-foreground">Sin oportunidades.</p>}
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
