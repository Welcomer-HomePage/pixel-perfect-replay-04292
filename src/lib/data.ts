import Papa from "papaparse";
import { useSyncExternalStore } from "react";
import { populateInbox } from "./inbox-seed";

// ============= Tipos =============
export type EstadoCliente = "Activo" | "En seguimiento" | "Inactivo";
export type TipoCliente = "Financiero" | "Público" | "Mixto" | "Privado";
export type EstadoOp =
  | "Identificada" | "En evaluación" | "En preparación"
  | "Observaciones" | "Propuesta" | "Presentada" | "Ganada" | "Perdida";

export type Tarea = { id: string; tarea: string; area: string; responsable: string; limite: string; estado: "Pendiente" | "En curso" | "Listo" };
export type Aprobacion = { id: string; tipo: "Aprobación técnica" | "Aprobación de presupuesto"; estado: "Pendiente" | "Aprobada" | "Rechazada"; solicitante: string; por?: string; fecha?: string; comentario?: string; aprobadorRol?: Rol };
export type Fase = { nombre: "Observaciones" | "Propuesta" | "Presentada"; fecha: string; respuesta: string; observaciones: string };
export type Proyecto = { lider: string; supervisor: string; costo: string; utilidad: string; avance: number };
export type HistorialItem = { fecha: string; quien: string; texto: string };

export type Oportunidad = {
  id: string; clienteId: string; proceso: string; valor: number;
  estado: EstadoOp; responsable: string; vence: string;
  fuente: "SECOP II" | "Portal propio" | "Venta directa" | "Otro"; observaciones?: string;
  pliegos: string[]; aliados: { nombre: string; experiencia: string }[];
  decision?: "Participar" | "No participar";
  tareas: Tarea[]; aprobaciones: Aprobacion[]; fases: Fase[];
  proyecto?: Proyecto; historial: HistorialItem[];
};

export type Interaccion = {
  id: string; clienteId: string; oportunidadId?: string;
  tipo: string; fecha: string; responsable: string;
  participantes: string; descripcion: string;
};
export type Pendiente = { id: string; clienteId: string; oportunidadId?: string; fecha: string; texto: string };
export type Pqr = { id: string; clienteId: string; oportunidadId?: string; asunto: string; estado: "Abierta" | "En gestión" | "Cerrada"; ans: string; fuente: string; tipo_identificacion?: "NIT" | "CC" | "CE" | "Pasaporte" | "Otro"; numero_identificacion?: string; fecha?: string; ans_horas?: number; responsable?: string };
export type Notificacion = { id: string; rol: Rol; texto: string; oportunidadId: string; paso: number; leida: boolean };

export type Cliente = {
  id: string; nombre: string; nit: string; tipo: TipoCliente; estado: EstadoCliente;
  responsable: string; lider: string; supervisor: string; ultimoContacto: string;
  costo: string; utilidad: string; historicos: number;
  proyectos: { nombre: string; estado: string }[];
  equipo: { nombre: string; perfil: string }[];
  lineas: string[];
};

export type Db = {
  inboxSeedVersion?: number;
  clientes: Cliente[]; oportunidades: Oportunidad[]; interacciones: Interaccion[];
  pendientes: Pendiente[]; pqr: Pqr[]; notificaciones: Notificacion[];
  proyectos: Contrato[]; equipo: Persona[]; encuestas: Encuesta[]; usuarios: Usuario[];
  aliados: { id: string; nombre: string; experiencia: string; tipo_cliente_afin: string; proyectos_conjuntos: number }[];
  origen: { archivo: string; fecha: string; experiencia: boolean };
  syncs: Record<IntegracionId,string>;
};
export type Contrato = {
  id: string; clienteId: string; oportunidadId: string; nombre: string; estado: "En ejecución" | "En cierre" | "Cerrado";
  lider: string; supervisor: string; costo_mcop: number | null; utilidad_pct: number | null;
  fecha_inicio: string; fecha_fin: string; no_contrato: string; linea_servicio: string; objeto: string;
  porcentaje_participacion: number; valor_contrato_cop: number; valor_smmlv: number | null; duracion: number;
  codigos_unspsc: string; actividades: string;
};
export type Persona = { id: string; proyectoId: string; nombre: string; perfil: string; experiencia: number };
export type Encuesta = { id: string; clienteId: string; proyectoId: string; fecha: string; nota: number; comentario: string; canal: "Forms" };
export type Usuario = { id: string; nombre: string; cargo: string; rol: Rol; area: string
};

// ============= Constantes =============
export const AREAS = ["Área técnica", "Área financiera", "Área jurídica", "Comercial"];
export const ROLES = ["Líder Comercial", "Gerente de área", "Gerencia Administrativa", "Recursos Humanos", "Líder de proyecto"] as const;
export type Rol = (typeof ROLES)[number] | "Administrador";

export const ETAPAS = [
  { n: 1, nombre: "Identificar", estados: ["Identificada"] as EstadoOp[] },
  { n: 2, nombre: "Evaluar", estados: ["En evaluación"] as EstadoOp[] },
  { n: 3, nombre: "Asignar y preparar", estados: ["En preparación"] as EstadoOp[] },
  { n: 4, nombre: "Seguir etapas", estados: ["Observaciones", "Propuesta", "Presentada"] as EstadoOp[] },
  { n: 5, nombre: "Ejecutar", estados: ["Ganada"] as EstadoOp[] },
];
export const etapaDe = (estado: EstadoOp): number => ETAPAS.find((e) => e.estados.includes(estado))?.n ?? 4;

export const EQUIPO_ESPECIALIZADO = [
  { nombre: "Juan Martínez", perfil: "Líder de proyecto", experiencia: "10 años", asignado: "Bancolombia · Fábrica de software" },
  { nombre: "Andrea Rojas", perfil: "Arquitecta de software", experiencia: "8 años", asignado: "BBVA · Mesa de ayuda" },
  { nombre: "Carlos Gómez", perfil: "Supervisor financiero", experiencia: "12 años", asignado: "Ecopetrol · Leasing" },
  { nombre: "Diana Castro", perfil: "Científica de datos", experiencia: "6 años", asignado: "" },
  { nombre: "Felipe Herrera", perfil: "Ingeniero DevOps", experiencia: "7 años", asignado: "" },
  { nombre: "Natalia Suárez", perfil: "Experta en ciberseguridad", experiencia: "9 años", asignado: "" },
];
// ============= Datos de ejemplo =============
const hoyISO = () => new Date().toISOString().slice(0, 10);
const fmt = (iso: string) => iso.split("-").reverse().join("/");
export const cop = (n: number) => `$${n.toLocaleString("es-CO")} M`;

const cli = (p: Partial<Cliente> & Pick<Cliente, "id" | "nombre" | "nit" | "tipo" | "estado">): Cliente => ({
  responsable: "Luisa Pérez", lider: "Juan Martínez", supervisor: "Carlos Gómez",
  ultimoContacto: "28/10/2026", costo: "$480 M", utilidad: "+18%", historicos: 12,
  proyectos: [
    { nombre: "Fábrica de software", estado: "En ejecución" },
    { nombre: "Mesa de ayuda", estado: "En cierre" },
  ],
  equipo: [
    { nombre: "Juan Martínez", perfil: "Líder de proyecto · 10 años" },
    { nombre: "Andrea Rojas", perfil: "Arquitecta de software · 8 años" },
    { nombre: "Carlos Gómez", perfil: "Supervisor · 12 años" },
  ],
  lineas: ["Fábrica de software", "Leasing", "Mesa de ayuda", "Analítica de datos"],
  ...p,
});

const op = (p: Partial<Oportunidad> & Pick<Oportunidad, "id" | "clienteId" | "proceso" | "valor" | "estado" | "vence">): Oportunidad => ({
  responsable: "Luisa Pérez", fuente: "SECOP II",
  pliegos: ["Pliego de condiciones.pdf", "Anexo técnico.xlsx"],
  aliados: [
    { nombre: "Softtek Andina", experiencia: "3 proyectos conjuntos en sector financiero" },
    { nombre: "DataCorp", experiencia: "Especialista en analítica para entidades públicas" },
  ],
  tareas: [], aprobaciones: [], fases: [], historial: [],
  ...p,
});

const tarea = (tarea: string, area: string, responsable: string, limite: string, estado: Tarea["estado"] = "Pendiente"): Tarea =>
  ({ id: crypto.randomUUID(), tarea, area, responsable, limite, estado });
const aprob = (tipo: Aprobacion["tipo"], solicitante: string, extra: Partial<Aprobacion> = {}): Aprobacion =>
  ({ id: `A-${Math.floor(Math.random() * 900 + 100)}`, tipo, estado: "Pendiente", solicitante, ...extra });

function seed(): Db {
  const hoy = hoyISO();
  const clientes: Cliente[] = [
    cli({ id: "bancolombia", nombre: "Bancolombia", nit: "890.903.938", tipo: "Financiero", estado: "Activo" }),
    cli({ id: "bbva", nombre: "BBVA", nit: "860.003.020", tipo: "Financiero", estado: "Activo", costo: "$320 M", utilidad: "+15%", historicos: 8 }),
    cli({ id: "fna", nombre: "Fondo Nacional del Ahorro", nit: "899.999.284", tipo: "Público", estado: "Activo", costo: "$210 M", utilidad: "+12%", historicos: 5 }),
    cli({ id: "idu", nombre: "IDU", nit: "899.999.081", tipo: "Público", estado: "En seguimiento", costo: "$150 M", utilidad: "+9%", historicos: 3 }),
    cli({ id: "ecopetrol", nombre: "Ecopetrol", nit: "899.999.068", tipo: "Mixto", estado: "Activo", costo: "$720 M", utilidad: "+22%", historicos: 15 }),
    cli({ id: "victimas", nombre: "Unidad para las Víctimas", nit: "900.633.085", tipo: "Público", estado: "En seguimiento", costo: "$95 M", utilidad: "+8%", historicos: 1, proyectos: [] }),
  ];

  const oportunidades: Oportunidad[] = [
    op({ id: "op-idu", clienteId: "idu", proceso: "Software misional", valor: 850, estado: "Identificada", vence: hoy, fuente: "Portal propio" }),
    op({ id: "op-victimas", clienteId: "victimas", proceso: "Analítica de datos", valor: 320, estado: "Identificada", vence: "2026-11-15" }),
    op({ id: "op-bbva-fab", clienteId: "bbva", proceso: "Fábrica de software 2027", valor: 540, estado: "En evaluación", vence: "2026-11-10", fuente: "Portal propio" }),
    op({ id: "op-fna-mesa", clienteId: "fna", proceso: "Mesa de ayuda", valor: 260, estado: "En preparación", vence: hoy,
      tareas: [
        tarea("Revisión de pliego", "Área técnica", "Juan Martínez", "2026-11-08", "En curso"),
        tarea("Estimación de costos", "Área financiera", "Carlos Gómez", "2026-11-09"),
        tarea("Matriz de riesgos", "Área jurídica", "Andrea Rojas", "2026-11-09"),
      ],
      aprobaciones: [aprob("Aprobación técnica", "Luisa Pérez"), aprob("Aprobación de presupuesto", "Luisa Pérez")],
    }),
    op({ id: "op-banco-ren", clienteId: "bancolombia", proceso: "Renovación fábrica", valor: 610, estado: "En preparación", vence: "2026-11-12",
      tareas: [tarea("Propuesta económica", "Área financiera", "Carlos Gómez", "2026-11-10", "En curso")],
      aprobaciones: [
        aprob("Aprobación técnica", "Andrea Rojas", { estado: "Aprobada", por: "Gerente de área", fecha: "30/10/2026", comentario: "Capacidad confirmada" }),
        aprob("Aprobación de presupuesto", "Andrea Rojas"),
      ],
    }),
    op({ id: "op-idu-obs", clienteId: "idu", proceso: "Plataforma de reportes", valor: 430, estado: "Observaciones", vence: "2026-11-14",
      fases: [{ nombre: "Observaciones", fecha: "2026-11-14", respuesta: "", observaciones: "Pliego en revisión por el área técnica" }],
    }),
    op({ id: "op-eco-prop", clienteId: "ecopetrol", proceso: "Leasing tecnológico", valor: 720, estado: "Propuesta", vence: hoy,
      fases: [
        { nombre: "Observaciones", fecha: "2026-10-20", respuesta: "Entidad ajustó cronograma", observaciones: "Se pidió ampliar cobertura" },
        { nombre: "Propuesta", fecha: hoy, respuesta: "", observaciones: "Propuesta económica en cierre" },
      ],
    }),
    op({ id: "op-fna-pres", clienteId: "fna", proceso: "Modernización core", valor: 980, estado: "Presentada", vence: "2026-11-20",
      fases: [
        { nombre: "Observaciones", fecha: "2026-10-10", respuesta: "Sin cambios", observaciones: "" },
        { nombre: "Propuesta", fecha: "2026-10-25", respuesta: "Recibida", observaciones: "" },
        { nombre: "Presentada", fecha: "2026-11-20", respuesta: "", observaciones: "Esperando evaluación de la entidad" },
      ],
    }),
    op({ id: "op-eco-gan", clienteId: "ecopetrol", proceso: "Soporte infraestructura", valor: 380, estado: "Ganada", vence: "2026-10-15",
      proyecto: { lider: "Juan Martínez", supervisor: "Carlos Gómez", costo: "$290 M", utilidad: "+21%", avance: 65 },
    }),
    op({ id: "op-banco-gan", clienteId: "bancolombia", proceso: "Mesa de ayuda", valor: 240, estado: "Ganada", vence: "2026-09-30",
      proyecto: { lider: "Juan Martínez", supervisor: "Carlos Gómez", costo: "$200 M", utilidad: "+16%", avance: 90 },
    }),
  ];

  return {
    ...emptyDb(), clientes, oportunidades,
    origen: { archivo: "Datos de ejemplo", fecha: new Date().toISOString(), experiencia: false },
    equipo: EQUIPO_ESPECIALIZADO.map((p, i) => ({ id: `EQ-${i}`, proyectoId: "", nombre: p.nombre, perfil: p.perfil, experiencia: parseInt(p.experiencia) })),
    usuarios: demoUsuarios(),
    proyectos: oportunidades.filter((o) => o.proyecto).map((o, i) => ({ id: `P-${i + 1}`, clienteId: o.clienteId, oportunidadId: o.id, nombre: o.proceso, estado: "En ejecución" as const, lider: o.proyecto?.lider ?? "", supervisor: o.proyecto?.supervisor ?? "", costo_mcop: o.valor * .8, utilidad_pct: 18, fecha_inicio: "2026-01-01", fecha_fin: o.vence, no_contrato: "", linea_servicio: o.proceso, objeto: o.proceso, porcentaje_participacion: 1, valor_contrato_cop: o.valor * 1e6, valor_smmlv: 0, duracion: 12, codigos_unspsc: "", actividades: "" })),
    interacciones: [
      { id: "i1", clienteId: "bancolombia", oportunidadId: "op-banco-ren", tipo: "Reunión", fecha: "2026-10-28", responsable: "Luisa Pérez", participantes: "Gerencia TI", descripcion: "Revisión de avances del proyecto y nuevas necesidades." },
      { id: "i2", clienteId: "idu", oportunidadId: "op-idu-obs", tipo: "Llamada", fecha: "2026-10-30", responsable: "Luisa Pérez", participantes: "Subdirección de contratación", descripcion: "Aclaraciones sobre el pliego de la plataforma de reportes." },
      { id: "i3", clienteId: "ecopetrol", oportunidadId: "op-eco-gan", tipo: "Correo", fecha: "2026-11-01", responsable: "Juan Martínez", participantes: "", descripcion: "Envío de informe mensual de avance del soporte." },
    ],
    pendientes: [
      { id: "p1", clienteId: "bancolombia", oportunidadId: "op-banco-ren", fecha: "05/11/2026", texto: "Enviar propuesta de renovación" },
      { id: "p2", clienteId: "bancolombia", fecha: "12/11/2026", texto: "Reunión de seguimiento trimestral" },
      { id: "p3", clienteId: "idu", oportunidadId: "op-idu-obs", fecha: "14/11/2026", texto: "Radicar observaciones al pliego" },
    ],
    pqr: [
      { id: "PQR-0142", clienteId: "bancolombia", oportunidadId: "op-banco-gan", asunto: "Demora en respuesta de mesa de ayuda", estado: "Abierta", ans: "Vence en 6 h", fuente: "Microsoft Forms" },
      { id: "PQR-0145", clienteId: "idu", asunto: "Error en módulo de reportes", estado: "Abierta", ans: "Vencido", fuente: "ISSA" },
      { id: "PQR-0148", clienteId: "bbva", asunto: "Solicitud de ajuste de alcance", estado: "En gestión", ans: "Vence en 30 h", fuente: "SharePoint" },
    ],
    notificaciones: [
      { id: "n1", rol: "Gerente de área", texto: "Aprobación técnica pendiente: FNA · Mesa de ayuda", oportunidadId: "op-fna-mesa", paso: 3, leida: false },
      { id: "n2", rol: "Líder Comercial", texto: "La propuesta de Ecopetrol · Leasing tecnológico vence hoy", oportunidadId: "op-eco-prop", paso: 4, leida: false },
      { id: "n3", rol: "Líder de proyecto", texto: "PQR-0142 de Bancolombia vence en 6 horas", oportunidadId: "op-banco-gan", paso: 5, leida: false },
    ],
  };
}

// ============= Store con persistencia =============
export function demoUsuarios(): Usuario[] {
  return ROLES.map((rol, i) => ({ id: `U-${i}`, nombre: ["Luisa Pérez", "Andrea Rojas", "Carlos Gómez", "Diana Castro", "Juan Martínez"][i] ?? rol, cargo: rol, rol, area: i === 0 ? "Comercial" : "Área técnica" }));
}
export function emptyDb(): Db {
  return { clientes: [], oportunidades: [], proyectos: [], equipo: [], encuestas: [], usuarios: [], aliados: [], interacciones: [], pendientes: [], pqr: [], notificaciones: [], syncs: {issa:"Sin sincronizar",forms:"Sin sincronizar",siigo:"Sin sincronizar",sharepoint:"Sin sincronizar",portales:"Sin sincronizar"}, origen: { archivo: "Sin archivo", fecha: "", experiencia: false } };
}
const KEY = "tci-db-v3";
const serverDb = emptyDb();
let db: Db = serverDb;
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
export const getDb = () => db;
const emit = () => {
  try { if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(db)); } catch { throw new Error("No hay espacio en este navegador para guardar el archivo."); }
  listeners.forEach((l) => l());
};
export function refreshStore() { listeners.forEach((l) => l()); }
export const useDb = () => useSyncExternalStore(subscribe, () => db, () => serverDb);
export function deriveDb(d: Db): Db {
  return { ...d, clientes: d.clientes.map((c) => {
    const ps = d.proyectos.filter((p) => p.clienteId === c.id);
    const cost = ps.some((p) => p.costo_mcop !== null) ? ps.reduce((a, p) => a + (p.costo_mcop ?? 0), 0) : ps.reduce((a, p) => a + p.valor_contrato_cop / 1e6, 0);
    return { ...c, costo: ps.length ? cop(cost) : (c.costo || "—"), historicos: ps.length, proyectos: ps.map((p) => ({ nombre: p.nombre, estado: p.estado })), lineas: [...new Set(ps.flatMap((p) => p.linea_servicio.split("; ")).filter(Boolean))], equipo: d.equipo.filter((e) => ps.some((p) => p.id === e.proyectoId)).map((e) => ({ nombre: e.nombre, perfil: `${e.perfil} · ${e.experiencia} años` })) };
  }) };
}
export function replaceDb(next: Db) { const prev = db; db = deriveDb(next); try { emit(); } catch (e) { db = prev; throw e; } }
export function restoreDemo() { replaceDb(seed()); }
export function hasCrmData(d: Db) {
  return [d.clientes, d.oportunidades, d.proyectos, d.equipo, d.encuestas, d.aliados, d.interacciones, d.pendientes, d.pqr, d.notificaciones].some((rows) => rows.length > 0);
}
export async function loadRealTci() {
  const real = await import("./real-data.json");
  replaceDb(populateInbox({ ...emptyDb(), ...(real.default as Pick<Db, "clientes" | "proyectos" | "oportunidades">), usuarios: db.usuarios.length ? db.usuarios : demoUsuarios(), origen: { archivo: "Datos reales de TCI", fecha: new Date().toISOString(), experiencia: true } }));
}
export async function hydrateDb() {
  if (typeof window === "undefined") return;
  try { const raw = window.localStorage.getItem(KEY); if (raw) { const saved=JSON.parse(raw) as Db; db = deriveDb({...saved,syncs:saved.syncs??emptyDb().syncs}); if (hasCrmData(db)) {
    if (!db.oportunidades.length && db.clientes.length) {
      const real = await import("./real-data.json");
      const ids = new Set(db.clientes.map((c) => c.id));
      const ops = (real.default as Pick<Db, "oportunidades">).oportunidades.filter((o) => ids.has(o.clienteId));
      if (ops.length) { db = deriveDb({ ...db, oportunidades: ops }); }
    }
    const populated = populateInbox(db);
    if (populated !== db) replaceDb(populated);
    else refreshStore();
    return;
  } } } catch { /* archivo local inválido */ }
  await loadRealTci();
}

// ============= Derivados =============
export const clienteDe = (d: Db, id: string) => d.clientes.find((c) => c.id === id);
export const opDe = (d: Db, id: string) => d.oportunidades.find((o) => o.id === id);
export const pqrVencidosDe = (d: Db, clienteId: string) => d.pqr.filter((p) => p.clienteId === clienteId && p.ans === "Vencido" && p.estado !== "Cerrada");
export const venceHoy = (o: Oportunidad) => o.vence === hoyISO() && o.estado !== "Ganada";
export const cargaPorResponsable = (d: Db) => {
  const carga: Record<string, number> = {};
  d.oportunidades.forEach((o) => o.tareas.forEach((t) => {
    if (t.estado !== "Listo") carga[t.responsable] = (carga[t.responsable] ?? 0) + 1;
  }));
  return carga;
};
export const alertasDe = (o: Oportunidad, d: Db): string[] => {
  const a: string[] = [];
  if (o.estado === "Identificada") a.push("Sin atender");
  if (venceHoy(o)) a.push("Vence hoy");
  if (pqrVencidosDe(d, o.clienteId).length) a.push("PQR con ANS vencido");
  return a;
};

// ============= Mutaciones =============
const historial = (quien: string, texto: string): HistorialItem => ({ fecha: `${fmt(hoyISO())} ${new Date().toTimeString().slice(0, 5)}`, quien, texto });

export function avanzarEtapa(opId: string, quien: string) {
  db = { ...db, oportunidades: db.oportunidades.map((o) => {
    if (o.id !== opId) return o;
    const etapa = etapaDe(o.estado);
    const siguiente: Record<number, EstadoOp> = { 1: "En evaluación", 2: "En preparación", 3: "Observaciones", 4: "Ganada" };
    const nuevo = siguiente[etapa];
    if (!nuevo || etapa === 3 && o.aprobaciones.some((a)=>a.estado==="Pendiente")) return o;
    const act: Oportunidad = { ...o, estado: nuevo, historial: [...o.historial, historial(quien, `Avanzó a «${ETAPAS[etapa]?.nombre ?? nuevo}» (estado: ${nuevo})`)] };
    if (nuevo === "Ganada" && !act.proyecto) {
      act.proyecto = { lider: clienteDe(db,act.clienteId)?.lider ?? "", supervisor: clienteDe(db,act.clienteId)?.supervisor ?? "", costo: "—", utilidad: "—", avance: 0 };
      act.historial.push(historial(quien, "Oportunidad ganada: se creó el proyecto vinculado"));
    }
    return act;
  }) };
  const o = opDe(db, opId);
  if(o?.estado === "Ganada" && !db.proyectos.some((p)=>p.oportunidadId===o.id)) {
    db={...db,proyectos:[...db.proyectos,{id:`P-${o.id}`,clienteId:o.clienteId,oportunidadId:o.id,nombre:o.proceso,estado:"En ejecución",lider:o.proyecto?.lider??"",supervisor:o.proyecto?.supervisor??"",costo_mcop:null,utilidad_pct:null,fecha_inicio:hoyISO(),fecha_fin:"",no_contrato:"",linea_servicio:"",objeto:o.proceso,porcentaje_participacion:1,valor_contrato_cop:o.valor*1e6,valor_smmlv:null,duracion:0,codigos_unspsc:"",actividades:""}]};
    db=deriveDb(db);
  }
  if (o?.estado === "Ganada") {
    db = { ...db, clientes: db.clientes.map((c) => (c.id === o.clienteId && c.estado !== "Activo" ? { ...c, estado: "Activo" as EstadoCliente } : c)) };
  }
  emit();
}

export function decidirParticipacion(opId: string, decision: "Participar" | "No participar", quien: string) {
  db = { ...db, oportunidades: db.oportunidades.map((o) => o.id === opId
    ? { ...o, decision, historial: [...o.historial, historial(quien, `Decisión de evaluación: ${decision}`)] } : o) };
  emit();
}

export function asignarTarea(opId: string, t: Omit<Tarea, "id" | "estado">, notificar: boolean) {
  const nueva: Tarea = { ...t, id: crypto.randomUUID(), estado: "Pendiente" };
  db = { ...db, oportunidades: db.oportunidades.map((o) => o.id === opId
    ? { ...o, tareas: [...o.tareas, nueva], historial: [...o.historial, historial(o.responsable, `Tarea asignada a ${t.responsable}: ${t.tarea}`)] } : o) };
  if (notificar) {
    const rol: Rol = t.area === "Comercial" ? "Líder Comercial" : "Gerente de área";
    const o = opDe(db, opId);
    db = { ...db, notificaciones: [{ id: crypto.randomUUID(), rol, texto: `Nueva tarea para ${t.responsable}: ${t.tarea} (${o?.proceso ?? ""})`, oportunidadId: opId, paso: 3, leida: false }, ...db.notificaciones] };
  }
  emit();
}

export function cambiarEstadoTarea(opId: string, tareaId: string, estado: Tarea["estado"]) {
  db = { ...db, oportunidades: db.oportunidades.map((o) => o.id === opId
    ? { ...o, tareas: o.tareas.map((t) => (t.id === tareaId ? { ...t, estado } : t)) } : o) };
  emit();
}

export function resolverAprobacion(opId: string, aprobId: string, estado: "Aprobada" | "Rechazada", quien: string, comentario: string) {
  db = { ...db, oportunidades: db.oportunidades.map((o) => o.id === opId
    ? { ...o,
        aprobaciones: o.aprobaciones.map((a) => a.id === aprobId ? { ...a, estado, por: quien, fecha: fmt(hoyISO()), comentario } : a),
        historial: [...o.historial, historial(quien, `${estado === "Aprobada" ? "Aprobó" : "Rechazó"} ${o.aprobaciones.find((a) => a.id === aprobId)?.tipo ?? "aprobación"}${comentario ? `: ${comentario}` : ""}`)],
      } : o) };
  emit();
}

export function agregarInteraccion(clienteId: string, oportunidadId: string | undefined, i: Omit<Interaccion, "id" | "clienteId" | "oportunidadId">, proxima?: { fecha: string; descripcion: string }) {
  db = {
    ...db,
    interacciones: [{ ...i, id: crypto.randomUUID(), clienteId, ...(oportunidadId ? { oportunidadId } : {}) }, ...db.interacciones],
    pendientes: proxima
      ? [...db.pendientes, { id: crypto.randomUUID(), clienteId, ...(oportunidadId ? { oportunidadId } : {}), fecha: fmt(proxima.fecha), texto: proxima.descripcion }]
      : db.pendientes,
    clientes: db.clientes.map((c) => (c.id === clienteId ? { ...c, ultimoContacto: fmt(i.fecha) } : c)),
  };
  emit();
}

export function actualizarFase(opId: string, nombre: Fase["nombre"], campo: "respuesta" | "observaciones", valor: string) {
  db = { ...db, oportunidades: db.oportunidades.map((o) => o.id === opId
    ? { ...o, fases: o.fases.map((f) => (f.nombre === nombre ? { ...f, [campo]: valor } : f)) } : o) };
  emit();
}

export function marcarNotificacionesLeidas(rol: Rol) {
  db = { ...db, notificaciones: db.notificaciones.map((n) => (n.rol === rol ? { ...n, leida: true } : n)) };
  emit();
}

export function importarOportunidades(): number {
  const client=db.clientes[0];if(!client)return 0;
  const proceso=`Proceso simulado desde portal · ${client.nombre}`;
  if(db.oportunidades.some((o)=>o.proceso===proceso))return 0;
  const next:Oportunidad={id:`op-imp-${Date.now()}`,clienteId:client.id,proceso,valor:0,estado:"Identificada",vence:hoyISO(),fuente:"Portal propio",responsable:client.responsable,pliegos:[],aliados:[],tareas:[],aprobaciones:[],fases:[],historial:[]};
  db={...db,oportunidades:[...db.oportunidades,next]};emit();return 1;
}

// ============= Rol =============
let rol: Rol = "Líder Comercial";
const rolListeners = new Set<() => void>();
export const useRol = () => useSyncExternalStore((l) => { rolListeners.add(l); return () => rolListeners.delete(l); }, () => rol, () => "Líder Comercial" as Rol);
export function setRol(r: Rol) {
  rol = r;
  if (typeof window !== "undefined") window.localStorage.setItem("tci-rol", r);
  rolListeners.forEach((l) => l());
}

// ============= Integraciones =============
export type IntegracionId = "issa" | "forms" | "siigo" | "sharepoint" | "portales";
const ahora = () => new Date().toLocaleString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).replace(",", "");
const marcarSync=(id:IntegracionId)=>{db={...db,syncs:{...db.syncs,[id]:ahora()}};emit();};
export const useSyncs=()=>useDb().syncs;

/** Simula una sincronización y modifica datos reales de la app. Devuelve un resumen. */
export function sincronizar(id: IntegracionId): string {
  const rnd = (n: number) => Math.floor(Math.random() * n);
  let msg = "";
  if (id === "issa") {
    const c = db.clientes[rnd(db.clientes.length)];
    if (!c) return "Aún no hay datos";
    const caso = `PQR-${Math.floor(Math.random() * 9000 + 1000)}`;
    db = { ...db, pqr: [...db.pqr, { id: caso, clienteId: c.id, asunto: "Incidente reportado en ISSA", estado: "Abierta", ans: "Vence en 48 h", fuente: "ISSA" }] };
    msg = `1 caso nuevo (${caso}) para ${c.nombre}`;
  } else if (id === "forms") {
    const c = db.clientes[rnd(db.clientes.length)];
    if (!c) return "Aún no hay datos";
    const nota = (4 + Math.random()).toFixed(1);
    db = { ...db, encuestas: [...db.encuestas, { id: `f-${Date.now()}`, clienteId: c.id, proyectoId: "", fecha: hoyISO(), nota: Number(nota), comentario: "Respuesta recibida de Forms (simulada)", canal: "Forms" }] };
    msg = `Encuesta ${nota}/5 de ${c.nombre}`;
  } else if (id === "siigo") {
    if(!db.proyectos.length)return "Sin proyectos para sincronizar";
    db={...db,proyectos:db.proyectos.map((p)=>({...p,costo_mcop:(p.costo_mcop??p.valor_contrato_cop/1e6*.8)+rnd(20),utilidad_pct:8+rnd(15)}))};
    db=deriveDb(db);
    msg=`Costos y utilidad actualizados en ${db.proyectos.length} proyectos`;
  } else if (id === "sharepoint") {
    const ops = db.oportunidades.filter((o) => o.estado !== "Ganada");
    const o = ops[rnd(ops.length)];
    if (!o) return "Sin oportunidades para sincronizar";
    const doc = `Adenda_${o.pliegos.length + 1}.pdf`;
    db = { ...db, oportunidades: db.oportunidades.map((x) => x.id === o.id ? { ...x, pliegos: [...x.pliegos, doc], historial: [...x.historial, { fecha: ahora(), quien: "SharePoint", texto: `Documento sincronizado: ${doc}` }] } : x) };
    msg = `${doc} agregado a ${o.proceso}`;
  } else {
    const n = importarOportunidades();
    msg = n ? `${n} procesos nuevos en Identificar` : "Sin procesos nuevos";
  }
  if (id !== "portales") emit();
  marcarSync(id);
  return msg;
}

export const CSV_EJEMPLO = "entidad,proceso,valor,vence,fuente,responsable\nIDU,Mantenimiento de software,420,2026-12-05,SECOP II,Luisa Pérez\nEcopetrol,Mesa de servicios TI,980,2026-12-12,Portal propio,Luisa Pérez\n";

/** Importa licitaciones desde CSV (columnas: entidad, proceso, valor, vence, fuente, responsable). */
export function importarCsv(texto: string): { creadas: number; errores: string[] } {
  const parsed = Papa.parse<string[]>(texto, { skipEmptyLines: "greedy" });
  if (parsed.errors.some((e) => e.code !== "UndetectableDelimiter")) return { creadas: 0, errores: parsed.errors.map((e) => e.message) };
  const lineas = parsed.data;
  const errores: string[] = [];
  if (lineas.length < 2) return { creadas: 0, errores: ["El archivo no tiene filas de datos"] };
  const cab = (lineas[0] ?? []).map((h) => h.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
  const idx = (k: string) => cab.indexOf(k);
  for (const k of ["entidad", "proceso", "valor", "vence"]) if (idx(k) < 0) return { creadas: 0, errores: [`Falta la columna "${k}"`] };
  const nuevas: Oportunidad[] = [];
  lineas.slice(1).forEach((l, i) => {
    const f = l.map((x) => x.trim());
    const ent = f[idx("entidad")]?.toLowerCase() ?? "";
    const c = db.clientes.find((c) => c.nombre.toLowerCase() === ent || c.id === ent || c.nit === ent || c.nombre.toLowerCase().includes(ent));
    const valor = Number(f[idx("valor")]);
    const vence = f[idx("vence")] ?? "";
    const proceso = f[idx("proceso")] ?? "";
    if (!ent || !c) { errores.push(`Fila ${i + 2}: entidad "${f[idx("entidad")]}" no existe`); return; }
    if (!proceso) { errores.push(`Fila ${i + 2}: falta el proceso`); return; }
    if (!Number.isFinite(valor) || valor <= 0) { errores.push(`Fila ${i + 2}: valor inválido`); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(vence)) { errores.push(`Fila ${i + 2}: fecha debe ser AAAA-MM-DD`); return; }
    if (db.oportunidades.some((o) => o.clienteId === c.id && o.proceso === proceso) || nuevas.some((o) => o.clienteId === c.id && o.proceso === proceso)) { errores.push(`Fila ${i + 2}: ya existe`); return; }
    const fuente = idx("fuente") >= 0 && f[idx("fuente")]?.toLowerCase().includes("propio") ? "Portal propio" : "SECOP II";
    const responsable = f[idx("responsable")] || "";
    nuevas.push(op({ id: `op-csv-${Date.now()}-${i}`, clienteId: c.id, proceso, valor, estado: "Identificada", vence, fuente, responsable }));
  });
  if (nuevas.length) { db = { ...db, oportunidades: [...db.oportunidades, ...nuevas] }; emit(); marcarSync("portales"); }
  return { creadas: nuevas.length, errores };
}
