import { Button } from "@/components/ui/button";
import { useVisibleDb, useSession, isAdmin } from "@/lib/auth";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Check, FileText, LineChart, Lock, MessageSquarePlus } from "lucide-react";
import { AppShell, EstadoBadge, Migas } from "@/components/AppShell";
import { InteraccionPanel } from "@/components/InteraccionPanel";
import {
  AREAS, ETAPAS, actualizarFase, asignarTarea, avanzarEtapa,
  cambiarEstadoTarea, cargaPorResponsable, clienteDe, cop, decidirParticipacion,
  etapaDe, opDe, resolverAprobacion, useRol, venceHoy, type Oportunidad,
} from "@/lib/data";

export const Route = createFileRoute("/oportunidades/$id")({
  validateSearch: (s: Record<string, unknown>): { paso?: number | undefined } => ({
    paso: typeof s["paso"] === "number" && s["paso"] >= 1 && s["paso"] <= 5 ? s["paso"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Ficha de la oportunidad · TCI" },
      { name: "description", content: "Seguimiento de la oportunidad en las cinco etapas del proceso comercial." },
      { property: "og:title", content: "Ficha de la oportunidad · TCI" },
      { property: "og:description", content: "Identificar, evaluar, preparar, seguir y ejecutar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FichaOportunidad,
});

const label = "section-title mb-1.5 block text-xs";
const btn = "inline-flex items-center gap-2 rounded-md px-4 py-2 font-semibold";

function FichaOportunidad() {
  const { id } = Route.useParams();
  const { paso } = Route.useSearch();
  const db = useVisibleDb();
  const rol = useRol();
  const navigate = useNavigate({ from: Route.fullPath });
  const o = opDe(db, id);
  const [panel, setPanel] = useState(false);
  const [estudio, setEstudio] = useState(false);
  if (!o) throw notFound();

  const c = clienteDe(db, o.clienteId);
  if(!c) throw notFound();
  const etapaActual = etapaDe(o.estado);
  const pasoActivo = paso ?? etapaActual;
  const aprobPendientes = o.aprobaciones.filter((a) => a.estado === "Pendiente").length;
  const bloqueado = etapaActual === 3 && aprobPendientes > 0;
  const pqrCliente = db.pqr.filter((p) => p.clienteId === o.clienteId && p.estado !== "Cerrada");
  const carga = cargaPorResponsable(db);

  const irPaso = (n: number) => navigate({ search: { paso: n } });
  const avanzar = () => {
    if (bloqueado) { toast.error(`Faltan ${aprobPendientes} aprobaciones por resolver`); return; }
    avanzarEtapa(o.id, rol);
    toast.success("Etapa actualizada: la tarjeta se movió en el tablero");
    navigate({ search: { paso: undefined } });
  };

  return (
    <AppShell>
      <Migas items={[
        { label: "Tablero", to: "/" },
        { label: `${c.nombre} · ${o.proceso}` },
        { label: `Paso ${pasoActivo}` },
      ]} />

      {/* Encabezado fijo */}
      <div className="sticky top-0 z-30 -mx-6 border-b bg-background px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <Link to="/clientes/$id" params={{ id: c.id }} className="font-display text-2xl font-bold text-primary hover:underline">{c.nombre}</Link>
              <span className="text-muted-foreground">·</span>
              <h1 className="font-display text-2xl font-bold text-wine">{o.proceso}</h1>
              <EstadoBadge estado={o.estado} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {cop(o.valor)} · Etapa {etapaActual} de 5 · {o.responsable} · Vence {o.vence.split("-").reverse().join("/")}
              {venceHoy(o) && <span className="ml-2 rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">Vence hoy</span>}
            </p>
          </div>
          <Button variant="ghost" onClick={() => setPanel(true)} className={`${btn} bg-primary text-primary-foreground hover:bg-wine`}>
            <MessageSquarePlus className="h-4 w-4" /> Registrar interacción
          </Button>
        </div>
        {/* Stepper */}
        <div className="mt-4 flex gap-1 overflow-x-auto">
          {ETAPAS.map((e) => (
            <Button variant="ghost" key={e.n} onClick={() => irPaso(e.n)}
              className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold ${
                e.n === pasoActivo ? "bg-primary text-primary-foreground" : e.n < etapaActual ? "bg-success-soft text-success" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}>
              {e.n < etapaActual && <Check className="h-4 w-4" />}
              {e.n}. {e.nombre}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {pasoActivo === 1 && <Paso1 o={o} onAvanzar={avanzar} />}
        {pasoActivo === 2 && <Paso2 o={o} clienteId={c.id} rol={rol} estudio={estudio} setEstudio={setEstudio} onAvanzar={avanzar} />}
        {pasoActivo === 3 && <Paso3 o={o} rol={rol} carga={carga} bloqueado={bloqueado} aprobPendientes={aprobPendientes} onAvanzar={avanzar} />}
        {pasoActivo === 4 && <Paso4 o={o} onAbrirPanel={() => setPanel(true)} onAvanzar={avanzar} />}
        {pasoActivo === 5 && <Paso5 o={o} clienteId={c.id} pqr={pqrCliente} />}
      </div>

      {/* Historial */}
      <div className="mt-8 rounded-xl border bg-card p-5">
        <h3 className="section-title mb-3">Historial de la oportunidad</h3>
        {o.historial.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay movimientos registrados.</p>}
        {[...o.historial].reverse().map((h, i) => (
          <div key={i} className="border-b py-2 text-sm last:border-0">
            <span className="font-semibold">{h.quien}</span> · {h.texto}
            <span className="ml-2 text-xs text-muted-foreground">{h.fecha}</span>
          </div>
        ))}
      </div>

      <InteraccionPanel abierto={panel} onCerrar={() => setPanel(false)} clienteId={c.id} oportunidadId={o.id} />

      {/* Panel lateral: estudio de mercado */}
      {estudio && (
        <div className="fixed inset-0 z-50 flex justify-end bg-foreground/40" onClick={() => setEstudio(false)}>
          <aside className="h-full w-full max-w-md overflow-y-auto bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-2xl font-bold uppercase tracking-normal text-wine">Estudio de mercado</h2>
            <p className="mt-2 text-sm text-muted-foreground">Resumen simulado para {c.nombre} · {o.proceso}</p>
            <div className="mt-4 space-y-3 text-sm">
              <p><strong>Competidores probables:</strong> 4 firmas con experiencia en el sector {c.tipo.toLowerCase()}.</p>
              <p><strong>Rango de valor de mercado:</strong> {cop(Math.round(o.valor * 0.85))} – {cop(Math.round(o.valor * 1.15))}.</p>
              <p><strong>Histórico de la entidad:</strong> {c.historicos} proyectos, utilidad {c.utilidad}.</p>
              <p><strong>Recomendación:</strong> evaluar el alcance y la capacidad del equipo antes de participar.</p>
            </div>
            <Button variant="ghost" onClick={() => setEstudio(false)} className="mt-6 rounded-md border px-6 py-2.5 font-semibold hover:bg-accent">Cerrar</Button>
          </aside>
        </div>
      )}
    </AppShell>
  );
}

// ============= Paso 1: Identificar =============
function Paso1({ o, onAvanzar }: { o: Oportunidad; onAvanzar: () => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border bg-card p-5">
        <h3 className="section-title mb-3">Identificación</h3>
        <dl className="space-y-3 text-sm">
          <div><dt className="font-semibold">Fuente</dt><dd>{o.fuente}</dd></div>
          <div><dt className="font-semibold">Observaciones</dt><dd>{o.observaciones || "—"}</dd></div>
          <div><dt className="font-semibold">Vencimiento</dt><dd>{o.vence.split("-").reverse().join("/")}</dd></div>
        </dl>
      </div>
      <div className="rounded-xl border bg-card p-5">
        <h3 className="section-title mb-3">Documentos del pliego</h3>
        {o.pliegos.map((p) => (
          <p key={p} className="flex items-center gap-2 border-b py-2 text-sm last:border-0"><FileText className="h-4 w-4 text-primary" /> {p}</p>
        ))}
      </div>
      {o.estado === "Identificada" && (
        <div className="md:col-span-2">
          <Button variant="ghost" onClick={onAvanzar} className={`${btn} bg-primary text-primary-foreground hover:bg-wine`}>Pasar a evaluación →</Button>
        </div>
      )}
    </div>
  );
}

// ============= Paso 2: Evaluar =============
function Paso2({ o, clienteId, rol, estudio, setEstudio, onAvanzar }: { o: Oportunidad; clienteId: string; rol: string; estudio: boolean; setEstudio: (v: boolean) => void; onAvanzar: () => void }) {
  const db = useVisibleDb();
  const c = clienteDe(db, clienteId);
  if(!c)return null;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border bg-card p-5">
        <h3 className="section-title mb-3">Histórico de la entidad (desde su Vista 360°)</h3>
        <div className="space-y-2 text-sm">
          {c.proyectos.map((p) => <div key={p.nombre} className="flex justify-between border-b py-1.5 last:border-0"><span className="font-medium">{p.nombre}</span><span className="text-muted-foreground">{p.estado}</span></div>)}
          <div className="flex justify-between py-1.5"><span className="font-medium">Valor contratado histórico</span><span>{c.costo}</span></div>
          <div className="flex justify-between py-1.5"><span className="font-medium">Utilidad histórica</span><span>{c.utilidad}</span></div>
        </div>
        <h4 className="section-title mb-2 mt-4">Equipo que intervino</h4>
        {c.equipo.map((e) => <p key={e.nombre} className="text-sm"><span className="font-medium">{e.nombre}</span> · <span className="text-muted-foreground">{e.perfil}</span></p>)}
      </div>
      <div className="rounded-xl border bg-card p-5">
        <h3 className="section-title mb-3">Aliados sugeridos</h3>
        {o.aliados.map((a) => (
          <div key={a.nombre} className="border-b py-2 text-sm last:border-0">
            <p className="font-semibold">{a.nombre}</p>
            <p className="text-muted-foreground">{a.experiencia}</p>
          </div>
        ))}
        <Button variant="ghost" onClick={() => setEstudio(true)} className={`${btn} mt-4 border border-primary text-primary hover:bg-accent`}>
          <LineChart className="h-4 w-4" /> Estudio de mercado
        </Button>
      </div>
      <div className="rounded-xl border bg-card p-5 md:col-span-2">
        <h3 className="section-title mb-3">Decisión</h3>
        {o.decision ? (
          <p className="text-sm">Decisión registrada: <strong>{o.decision}</strong></p>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Button variant="ghost" onClick={() => { decidirParticipacion(o.id, "Participar", rol); toast.success("Decisión: participar"); }} className={`${btn} bg-primary text-primary-foreground hover:bg-wine`}>Participar</Button>
            <Button variant="ghost" onClick={() => { decidirParticipacion(o.id, "No participar", rol); toast.info("Decisión: no participar"); }} className={`${btn} border border-primary text-primary hover:bg-accent`}>No participar</Button>
          </div>
        )}
        {o.estado === "En evaluación" && o.decision === "Participar" && (
          <Button variant="ghost" onClick={onAvanzar} className={`${btn} mt-4 bg-primary text-primary-foreground hover:bg-wine`}>Siguiente paso: Asignar y preparar →</Button>
        )}
      </div>
    </div>
  );
}

// ============= Paso 3: Asignar y preparar =============
function Paso3({ o, rol, carga, bloqueado, aprobPendientes, onAvanzar }: { o: Oportunidad; rol: string; carga: Record<string, number>; bloqueado: boolean; aprobPendientes: number; onAvanzar: () => void }) {
  const db=useVisibleDb();
  const session=useSession();
  const [a, setA] = useState({ tarea: "", area: AREAS[0] ?? "Comercial", responsable: db.usuarios[0]?.nombre ?? session?.nombre ?? "", fecha: "", notificar: true });
  const [comentarios, setComentarios] = useState<Record<string, string>>({});
  const puedeAprobar = rol === "Administrador" || rol === "Gerente de área" || rol === "Gerencia Administrativa";

  const asignar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!a.tarea.trim()) { toast.error("Escribe la tarea"); return; }
    if (!a.fecha) { toast.error("Selecciona una fecha límite"); return; }
    asignarTarea(o.id, { tarea: a.tarea, area: a.area, responsable: a.responsable, limite: a.fecha }, a.notificar);
    toast.success(`Tarea asignada a ${a.responsable}${a.notificar ? " · Notificación generada" : ""}`);
    setA({ ...a, tarea: "", fecha: "" });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Matriz de tareas */}
        <div className="rounded-xl border bg-card p-5 lg:col-span-2">
          <h3 className="section-title mb-3">Matriz de tareas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground">{["Tarea", "Área", "Responsable", "Límite", "Estado"].map((h) => <th key={h} className="pb-2 pr-3 font-display uppercase tracking-normal">{h}</th>)}</tr></thead>
              <tbody>
                {o.tareas.map((t) => (
                  <tr key={t.id} className="border-t">
                    <td className="py-2 pr-3 font-medium">{t.tarea}</td>
                    <td className="py-2 pr-3">{t.area}</td>
                    <td className="py-2 pr-3">{t.responsable}</td>
                    <td className="py-2 pr-3">{t.limite.split("-").reverse().join("/")}</td>
                    <td className="py-2">
                      <select aria-label="Estado de la tarea" value={t.estado} onChange={(e) => cambiarEstadoTarea(o.id, t.id, e.target.value as typeof t.estado)}
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${t.estado === "Listo" ? "bg-success-soft text-success" : t.estado === "En curso" ? "bg-warning-soft text-warning-foreground" : "bg-secondary text-secondary-foreground"}`}>
                        {["Pendiente", "En curso", "Listo"].map((x) => <option key={x}>{x}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {o.tareas.length === 0 && <tr><td colSpan={5} className="py-3 text-muted-foreground">Sin tareas asignadas.</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Formulario de asignación integrado */}
          <form onSubmit={asignar} className="mt-4 rounded-lg border bg-background p-4">
            <h4 className="section-title mb-3">Asignar tarea</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className={label}>Tarea</label><input className="field" value={a.tarea} onChange={(e) => setA({ ...a, tarea: e.target.value })} /></div>
              <div><label className={label}>Área</label>
                <select className="field" value={a.area} onChange={(e) => { const area = e.target.value; setA({ ...a, area, responsable: db.usuarios.find((u)=>u.area===area)?.nombre ?? session?.nombre ?? "" }); }}>
                  {AREAS.map((x) => <option key={x}>{x}</option>)}
                </select>
              </div>
              <div><label className={label}>Responsable</label>
                <select className="field" value={a.responsable} onChange={(e) => setA({ ...a, responsable: e.target.value })}>
                  {[...new Set([session?.nombre??"",...db.usuarios.filter((u)=>u.area===a.area).map((u)=>u.nombre)].filter(Boolean))].map((x) => <option key={x}>{x}</option>)}
                </select>
              </div>
              <div><label className={label}>Fecha límite</label><input type="date" className="field" value={a.fecha} onChange={(e) => setA({ ...a, fecha: e.target.value })} /></div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="h-4 w-4 accent-primary" checked={a.notificar} onChange={(e) => setA({ ...a, notificar: e.target.checked })} /> Notificar por correo y en la app</label>
              <Button variant="ghost" className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-wine">Asignar</Button>
            </div>
          </form>
        </div>

        {/* Carga por responsable */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="section-title mb-3">Carga por responsable</h3>
          {Object.entries(carga).sort((x, y) => y[1] - x[1]).map(([nombre, n]) => (
            <div key={nombre} className={`mb-2 flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${n >= 3 ? "border-destructive bg-destructive/10" : ""}`}>
              <span className="font-medium">{nombre}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${n >= 3 ? "bg-destructive text-destructive-foreground" : "bg-secondary text-secondary-foreground"}`}>{n} requerimientos</span>
            </div>
          ))}
          <p className="mt-2 text-xs text-muted-foreground">Se resalta en rojo quien tenga 3 o más requerimientos abiertos.</p>
        </div>
      </div>

      {/* Aprobaciones */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="section-title mb-3">Aprobaciones</h3>
        {o.aprobaciones.length === 0 && <p className="text-sm text-muted-foreground">Esta oportunidad no requiere aprobaciones.</p>}
        {o.aprobaciones.map((ap) => (
          <div key={ap.id} className="border-b py-3 last:border-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{ap.tipo} <span className="text-sm font-normal text-muted-foreground">· solicita {ap.solicitante}</span></p>
                {ap.estado !== "Pendiente" && <p className="text-sm text-muted-foreground">{ap.estado} por {ap.por} el {ap.fecha}{ap.comentario ? ` · “${ap.comentario}”` : ""}</p>}
              </div>
              {ap.estado === "Pendiente" ? (
                (puedeAprobar && (rol === "Administrador" || (ap.aprobadorRol ?? (ap.tipo === "Aprobación técnica" ? "Gerente de área" : "Gerencia Administrativa")) === rol)) ? (
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => { resolverAprobacion(o.id, ap.id, "Aprobada", rol, comentarios[ap.id] ?? ""); toast.success(`${ap.tipo} aprobada`); }} className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-wine">Aprobar</Button>
                    <Button variant="ghost" onClick={() => { resolverAprobacion(o.id, ap.id, "Rechazada", rol, comentarios[ap.id] ?? ""); toast.error(`${ap.tipo} rechazada`); }} className="rounded-md border border-primary px-4 py-1.5 text-sm font-semibold text-primary hover:bg-accent">Rechazar</Button>
                  </div>
                ) : <span className="rounded-full bg-warning-soft px-3 py-1 text-xs font-semibold text-warning-foreground">Pendiente de {ap.tipo === "Aprobación de presupuesto" ? "Gerencia Administrativa" : "Gerente de área"}</span>
              ) : (
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${ap.estado === "Aprobada" ? "bg-success-soft text-success" : "bg-destructive text-destructive-foreground"}`}>{ap.estado}</span>
              )}
            </div>
            {ap.estado === "Pendiente" && puedeAprobar && (
              <input className="field mt-2 max-w-md" placeholder="Comentario (opcional)" value={comentarios[ap.id] ?? ""} onChange={(e) => setComentarios({ ...comentarios, [ap.id]: e.target.value })} />
            )}
          </div>
        ))}
      </div>

      {o.estado === "En preparación" && (
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onAvanzar} disabled={bloqueado} className={`${btn} ${bloqueado ? "cursor-not-allowed bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:bg-wine"}`}>
            {bloqueado && <Lock className="h-4 w-4" />} Siguiente paso: Seguir etapas →
          </Button>
          {bloqueado && <p className="text-sm font-semibold text-destructive">Faltan {aprobPendientes} aprobación{aprobPendientes !== 1 && "es"} por resolver.</p>}
        </div>
      )}
    </div>
  );
}

// ============= Paso 4: Seguir etapas =============
function Paso4({ o, onAbrirPanel, onAvanzar }: { o: Oportunidad; onAbrirPanel: () => void; onAvanzar: () => void }) {
  const fases: ("Observaciones" | "Propuesta" | "Presentada")[] = ["Observaciones", "Propuesta", "Presentada"];
  return (
    <div className="space-y-4">
      {venceHoy(o) && (
        <p className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground">⚠ Esta oportunidad vence hoy. Registra la interacción o radica la entrega correspondiente.</p>
      )}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="section-title mb-4">Línea de tiempo de fases</h3>
        <div className="space-y-4">
          {fases.map((nombre) => {
            const f = o.fases.find((x) => x.nombre === nombre);
            const activa = o.estado === nombre;
            return (
              <div key={nombre} className={`rounded-lg border p-4 ${activa ? "border-primary bg-accent" : ""}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-display text-lg font-bold">{nombre} {activa && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">Fase actual</span>}</p>
                  {f && <p className="text-sm text-muted-foreground">Fecha: {f.fecha.split("-").reverse().join("/")}</p>}
                </div>
                {f ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div><label className={label}>Respuesta de la entidad</label>
                      <input className="field" value={f.respuesta} placeholder="Sin respuesta aún" onChange={(e) => actualizarFase(o.id, nombre, "respuesta", e.target.value)} /></div>
                    <div><label className={label}>Observaciones</label>
                      <input className="field" value={f.observaciones} onChange={(e) => actualizarFase(o.id, nombre, "observaciones", e.target.value)} /></div>
                  </div>
                ) : <p className="mt-2 text-sm text-muted-foreground">Aún no se llega a esta fase.</p>}
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="ghost" onClick={onAbrirPanel} className={`${btn} bg-primary text-primary-foreground hover:bg-wine`}>
          <MessageSquarePlus className="h-4 w-4" /> Registrar interacción
        </Button>
        {(o.estado === "Observaciones" || o.estado === "Propuesta" || o.estado === "Presentada") && (
          <Button variant="ghost" onClick={onAvanzar} className={`${btn} border border-primary text-primary hover:bg-accent`}>Marcar como ganada →</Button>
        )}
      </div>
    </div>
  );
}

// ============= Paso 5: Ejecutar y gestionar =============
function Paso5({ o, clienteId, pqr }: { o: Oportunidad; clienteId: string; pqr: { id: string; asunto: string; estado: string; ans: string; fuente: string }[] }) {
  const db=useVisibleDb();
  const last=db.encuestas.filter((e)=>e.clienteId===clienteId).sort((a,b)=>b.fecha.localeCompare(a.fecha))[0];
  if (o.estado !== "Ganada" || !o.proyecto) {
    return <p className="rounded-xl border bg-card p-5 text-muted-foreground">La oportunidad aún no está ganada. Cuando se marque como Ganada, aquí aparecerá el proyecto vinculado.</p>;
  }
  const p = o.proyecto;
  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-5">
        <h3 className="section-title mb-3">Proyecto vinculado</h3>
        <dl className="grid gap-4 text-sm sm:grid-cols-4">
          {[["Líder de proyecto", p.lider], ["Supervisor", p.supervisor], ["Costo", p.costo], ["Utilidad", p.utilidad]].map(([k, v]) => (
            <div key={k}><dt className="section-title text-xs">{k}</dt><dd className="mt-1 font-medium">{v}</dd></div>
          ))}
        </dl>
        <div className="mt-4">
          <div className="flex justify-between text-sm font-semibold"><span>Avance</span><span>{p.avance}%</span></div>
          <div className="mt-1 h-3 rounded-full bg-secondary"><div className="h-3 rounded-full bg-primary" style={{ width: `${p.avance}%` }} /></div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="section-title mb-3">PQR abiertos</h3>
          {pqr.length === 0 && <p className="text-sm text-muted-foreground">Sin PQR abiertos.</p>}
          {pqr.map((x) => (
            <div key={x.id} className="flex items-center justify-between gap-3 border-b py-2 text-sm last:border-0">
              <div><p className="font-medium">{x.id} · {x.asunto}</p><p className="text-xs text-muted-foreground">Fuente: {x.fuente}</p></div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${x.ans === "Vencido" ? "bg-destructive text-destructive-foreground" : "bg-warning-soft text-warning-foreground"}`}>ANS: {x.ans}</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl border bg-card p-5">
          <h3 className="section-title mb-3">Última encuesta de satisfacción</h3>
          <p className="font-display text-4xl font-bold text-primary">{last?`${last.nota} / 5`:"—"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{last?`${last.fecha} · ${last.comentario}`:"Sin respuestas de Forms"}</p>
          <h3 className="section-title mb-2 mt-5">Próximos compromisos</h3>
          {db.pendientes.filter((p)=>p.clienteId===clienteId).map((p)=><p key={p.id} className="text-sm">{p.texto} · {p.fecha}</p>)}
        </div>
      </div>
      <Link to="/clientes/$id" params={{ id: clienteId }} className={`${btn} bg-primary text-primary-foreground hover:bg-wine`}>Ver cliente 360 →</Link>
    </div>
  );
}
