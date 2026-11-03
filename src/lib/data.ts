import { useSyncExternalStore } from "react";

export type Estado = "Activo" | "En seguimiento";
export type Interaccion = {
  id: string; tipo: string; fecha: string; responsable: string;
  participantes: string; descripcion: string;
  proxima?: { fecha: string; descripcion: string } | undefined;
};
export type Cliente = {
  id: string; nombre: string; nit: string; estado: Estado;
  responsable: string; lider: string; ultimoContacto: string;
  costo: string; utilidad: string; historicos: number;
  proyectos: { nombre: string; estado: string }[];
  pqr: { abiertas: number; cerradas: number };
  pendientes: { fecha: string; texto: string }[];
  equipo: { nombre: string; perfil: string }[];
  lineas: string[];
  interacciones: Interaccion[];
};

export const USUARIOS = ["Luisa Pérez", "Carlos Gómez", "Andrea Rojas", "Julián Martínez"];

const base = (p: Partial<Cliente> & Pick<Cliente, "id" | "nombre" | "nit" | "estado">): Cliente => ({
  responsable: "Luisa Pérez", lider: "Carlos Gómez", ultimoContacto: "28/10/2026",
  costo: "$480 M", utilidad: "+18%", historicos: 12,
  proyectos: [
    { nombre: "Fábrica de software", estado: "En ejecución" },
    { nombre: "Mesa de ayuda", estado: "En cierre" },
  ],
  pqr: { abiertas: 2, cerradas: 9 },
  pendientes: [
    { fecha: "05/11/2026", texto: "Enviar propuesta de renovación" },
    { fecha: "12/11/2026", texto: "Reunión de seguimiento trimestral" },
  ],
  equipo: [
    { nombre: "Carlos Gómez", perfil: "Líder de proyecto · 10 años" },
    { nombre: "Andrea Rojas", perfil: "Arquitecta de software · 8 años" },
    { nombre: "Julián Martínez", perfil: "Analista QA · 5 años" },
  ],
  lineas: ["Fábrica de software", "Leasing", "Mesa de ayuda", "Analítica de datos"],
  interacciones: [
    { id: "i1", tipo: "Reunión", fecha: "2026-10-28", responsable: "Luisa Pérez", participantes: "Gerencia TI", descripcion: "Revisión de avances del proyecto y nuevas necesidades." },
  ],
  ...p,
});

let clientes: Cliente[] = [
  base({ id: "bancolombia", nombre: "Bancolombia", nit: "890.903.938", estado: "Activo" }),
  base({ id: "bbva", nombre: "BBVA", nit: "860.003.020", estado: "Activo", costo: "$320 M", utilidad: "+15%", historicos: 8, lider: "Andrea Rojas" }),
  base({ id: "fna", nombre: "Fondo Nacional del Ahorro", nit: "899.999.284", estado: "Activo", costo: "$210 M", utilidad: "+12%", historicos: 5 }),
  base({ id: "idu", nombre: "IDU", nit: "899.999.081", estado: "En seguimiento", costo: "$150 M", utilidad: "+9%", historicos: 3, pqr: { abiertas: 4, cerradas: 2 } }),
  base({ id: "ecopetrol", nombre: "Ecopetrol", nit: "899.999.068", estado: "Activo", costo: "$720 M", utilidad: "+22%", historicos: 15 }),
];

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
export const useClientes = () => useSyncExternalStore(subscribe, () => clientes, () => clientes);

export function agregarInteraccion(clienteId: string, i: Omit<Interaccion, "id">) {
  clientes = clientes.map((c) => {
    if (c.id !== clienteId) return c;
    const [y, m, d] = i.fecha.split("-");
    return {
      ...c,
      ultimoContacto: `${d}/${m}/${y}`,
      interacciones: [{ ...i, id: crypto.randomUUID() }, ...c.interacciones],
      pendientes: i.proxima ? [...c.pendientes, { fecha: i.proxima.fecha.split("-").reverse().join("/"), texto: i.proxima.descripcion }] : c.pendientes,
    };
  });
  listeners.forEach((l) => l());
}

export const ROLES = ["Líder Comercial", "Gerente de área", "Gerencia Administrativa", "Recursos Humanos", "Líder de proyecto"] as const;
export type Rol = (typeof ROLES)[number];
let rol: Rol = "Líder Comercial";
const rolListeners = new Set<() => void>();
export const useRol = () => useSyncExternalStore((l) => { rolListeners.add(l); return () => rolListeners.delete(l); }, () => rol, () => "Líder Comercial" as Rol);
export function setRol(r: Rol) { rol = r; rolListeners.forEach((l) => l()); }

export const EQUIPO_ESPECIALIZADO = [
  { nombre: "Carlos Gómez", perfil: "Líder de proyecto", experiencia: "10 años", asignado: "Bancolombia · Fábrica de software" },
  { nombre: "Andrea Rojas", perfil: "Arquitecta de software", experiencia: "8 años", asignado: "BBVA · Mesa de ayuda" },
  { nombre: "Julián Martínez", perfil: "Analista QA", experiencia: "5 años", asignado: "" },
  { nombre: "Diana Castro", perfil: "Científica de datos", experiencia: "6 años", asignado: "" },
  { nombre: "Felipe Herrera", perfil: "Ingeniero DevOps", experiencia: "7 años", asignado: "Ecopetrol · Leasing" },
  { nombre: "Natalia Suárez", perfil: "Experta en ciberseguridad", experiencia: "9 años", asignado: "" },
];
export const APROBACIONES = [
  { id: "A-031", proceso: "IDU · Software misional", tipo: "Aprobación técnica", solicitante: "Luisa Pérez", fecha: "02/11/2026" },
  { id: "A-029", proceso: "FNA · Mesa de ayuda", tipo: "Aprobación de presupuesto", solicitante: "Carlos Gómez", fecha: "01/11/2026" },
  { id: "A-027", proceso: "Bancolombia · Renovación", tipo: "Aprobación técnica", solicitante: "Andrea Rojas", fecha: "30/10/2026" },
];
export const PQR_ASIGNADAS = [
  { id: "PQR-0142", cliente: "Bancolombia", asunto: "Demora en respuesta de mesa de ayuda", estado: "Abierta", ans: "Vence en 6 h" },
  { id: "PQR-0145", cliente: "IDU", asunto: "Error en módulo de reportes", estado: "Abierta", ans: "Vencido" },
  { id: "PQR-0148", cliente: "BBVA", asunto: "Solicitud de ajuste de alcance", estado: "En gestión", ans: "Vence en 30 h" },
];
export const FUENTES = [
  { nombre: "ISSA", sync: "02/11/2026 18:40" },
  { nombre: "Microsoft Forms", sync: "02/11/2026 09:15" },
  { nombre: "Siigo", sync: "01/11/2026 23:00" },
  { nombre: "SharePoint", sync: "02/11/2026 17:05" },
];
