import { useSyncExternalStore } from "react";

// ============= Tipos =============
export type EstadoCliente = "Activo" | "En seguimiento";
export type TipoCliente = "Financiero" | "Público" | "Mixto" | "Privado";
export type EstadoOp =
  | "Identificada" | "En evaluación" | "En preparación"
  | "Observaciones" | "Propuesta" | "Presentada" | "Ganada";

export type Tarea = { id: string; tarea: string; area: string; responsable: string; limite: string; estado: "Pendiente" | "En curso" | "Listo" };
export type Aprobacion = { id: string; tipo: "Aprobación técnica" | "Aprobación de presupuesto"; estado: "Pendiente" | "Aprobada" | "Rechazada"; solicitante: string; por?: string; fecha?: string; comentario?: string };
export type Fase = { nombre: "Observaciones" | "Propuesta" | "Presentada"; fecha: string; respuesta: string; observaciones: string };
export type Proyecto = { lider: string; supervisor: string; costo: string; utilidad: string; avance: number };
export type HistorialItem = { fecha: string; quien: string; texto: string };

export type Oportunidad = {
  id: string; clienteId: string; proceso: string; valor: number;
  estado: EstadoOp; responsable: string; vence: string;
  fuente: "SECOP II" | "Portal propio"; requisitos: "Estándar" | "Dirigido";
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
export type Pqr = { id: string; clienteId: string; oportunidadId?: string; asunto: string; estado: "Abierta" | "En gestión" | "Cerrada"; ans: string; fuente: string };
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
  clientes: Cliente[]; oportunidades: Oportunidad[]; interacciones: Interaccion[];
  pendientes: Pendiente[]; pqr: Pqr[]; notificaciones: Notificacion[];
};

// ============= Constantes =============
export const USUARIOS = ["Luisa Pérez", "Juan Martínez", "Carlos Gómez", "Andrea Rojas"];
export const AREAS = ["Área técnica", "Área financiera", "Área jurídica", "Comercial"];
export const RESPONSABLES_POR_AREA: Record<string, string[]> = {
  "Área técnica": ["Juan Martínez", "Andrea Rojas"],
  "Área financiera": ["Carlos Gómez"],
  "Área jurídica": ["Carlos Gómez", "Andrea Rojas"],
  Comercial: ["Luisa Pérez"],
};
export const ROLES = ["Líder Comercial", "Gerente de área", "Gerencia Administrativa", "Recursos Humanos", "Líder de proyecto"] as const;
export type Rol = (typeof ROLES)[number];

export const ETAPAS = [
  { n: 1, nombre: "Identificar", estados: ["Identificada"] as EstadoOp[] },
  { n: 2, nombre: "Evaluar", estados: ["En evaluación"] as EstadoOp[] },
  { n: 3, nombre: "Asignar y preparar", estados: ["En preparación"] as EstadoOp[] },
  { n: 4, nombre: "Seguir etapas", estados: ["Observaciones", "Propuesta", "Presentada"] as EstadoOp[] },
  { n: 5, nombre: "Ejecutar", estados: ["Ganada"] as EstadoOp[] },
];
export const etapaDe = (estado: EstadoOp): number => ETAPAS.find((e) => e.estados.includes(estado))!.n;

export const EQUIPO_ESPECIALIZADO = [
  { nombre: "Juan Martínez", perfil: "Líder de proyecto", experiencia: "10 años", asignado: "Bancolombia · Fábrica de software" },
  { nombre: "Andrea Rojas", perfil: "Arquitecta de software", experiencia: "8 años", asignado: "BBVA · Mesa de ayuda" },
  { nombre: "Carlos Gómez", perfil: "Supervisor financiero", experiencia: "12 años", asignado: "Ecopetrol · Leasing" },
  { nombre: "Diana Castro", perfil: "Científica de datos", experiencia: "6 años", asignado: "" },
  { nombre: "Felipe Herrera", perfil: "Ingeniero DevOps", experiencia: "7 años", asignado: "" },
  { nombre: "Natalia Suárez", perfil: "Experta en ciberseguridad", experiencia: "9 años", asignado: "" },
];
export const FUENTES = [
  { nombre: "ISSA", sync: "02/11/2026 18:40" },
  { nombre: "Microsoft Forms", sync: "02/11/2026 09:15" },
  { nombre: "Siigo", sync: "01/11/2026 23:00" },
  { nombre: "SharePoint", sync: "02/11/2026 17:05" },
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
  responsable: "Luisa Pérez", fuente: "SECOP II", requisitos: "Estándar",
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
    op({ id: "op-idu", clienteId: "idu", proceso: "Software misional", valor: 850, estado: "Identificada", vence: hoy, fuente: "Portal propio", requisitos: "Dirigido" }),
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
    clientes,
    oportunidades,
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
const KEY = "tci-db-v2";
const seedDb = seed();
let db: Db = seedDb;
if (typeof window !== "undefined") {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) db = JSON.parse(raw) as Db;
  } catch { /* datos corruptos: se usa la semilla */ }
}

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const emit = () => {
  if (typeof window !== "undefined") {
    try { window.localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* sin espacio */ }
  }
  listeners.forEach((l) => l());
};
export const useDb = () => useSyncExternalStore(subscribe, () => db, () => seedDb);

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
    if (!nuevo) return o;
    const act: Oportunidad = { ...o, estado: nuevo, historial: [...o.historial, historial(quien, `Avanzó a «${ETAPAS[etapa]!.nombre}» (estado: ${nuevo})`)] };
    if (nuevo === "Ganada" && !act.proyecto) {
      act.proyecto = { lider: "Juan Martínez", supervisor: "Carlos Gómez", costo: cop(Math.round(act.valor * 0.8)), utilidad: "+18%", avance: 0 };
      act.historial.push(historial(quien, "Oportunidad ganada: se creó el proyecto vinculado"));
    }
    return act;
  }) };
  const o = opDe(db, opId);
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
    ? { ...o, tareas: [...o.tareas, nueva], historial: [...o.historial, historial("Luisa Pérez", `Tarea asignada a ${t.responsable}: ${t.tarea}`)] } : o) };
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
    interacciones: [{ ...i, id: crypto.randomUUID(), clienteId, oportunidadId }, ...db.interacciones],
    pendientes: proxima
      ? [...db.pendientes, { id: crypto.randomUUID(), clienteId, oportunidadId, fecha: fmt(proxima.fecha), texto: proxima.descripcion }]
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
  const nuevas: Oportunidad[] = [
    op({ id: `op-imp-${Date.now()}-1`, clienteId: "victimas", proceso: "Plataforma de atención", valor: 410, estado: "Identificada", vence: "2026-11-25", fuente: "Portal propio" }),
    op({ id: `op-imp-${Date.now()}-2`, clienteId: "bbva", proceso: "Analítica de riesgo", valor: 290, estado: "Identificada", vence: "2026-11-22" }),
  ].filter((n) => !db.oportunidades.some((o) => o.proceso === n.proceso && o.clienteId === n.clienteId));
  if (nuevas.length) { db = { ...db, oportunidades: [...db.oportunidades, ...nuevas] }; emit(); }
  return nuevas.length;
}

// ============= Rol =============
let rol: Rol = "Líder Comercial";
if (typeof window !== "undefined") {
  const saved = window.localStorage.getItem("tci-rol");
  if (saved && (ROLES as readonly string[]).includes(saved)) rol = saved as Rol;
}
const rolListeners = new Set<() => void>();
export const useRol = () => useSyncExternalStore((l) => { rolListeners.add(l); return () => rolListeners.delete(l); }, () => rol, () => "Líder Comercial" as Rol);
export function setRol(r: Rol) {
  rol = r;
  if (typeof window !== "undefined") window.localStorage.setItem("tci-rol", r);
  rolListeners.forEach((l) => l());
}
