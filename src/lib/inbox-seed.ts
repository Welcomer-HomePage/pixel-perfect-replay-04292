import type { Db, Persona, Tarea } from "./data";

/** One-time simulated work items for the bundled TCI dataset, never workbook imports. */
export function populateInbox(d: Db): Db {
  if (d.inboxSeedVersion === 1 || d.origen.archivo !== "Datos reales de TCI") return d;
  const active = d.oportunidades.filter((o) => o.id.startsWith("OP-NEW-") && o.estado !== "Perdida" && o.estado !== "Ganada");
  const oportunidades = d.oportunidades.map((o) => {
    if (!active.some((a) => a.id === o.id) || o.tareas.length) return o;
    const actions: Partial<Record<typeof o.estado, string>> = {
      Identificada: "Revisar requisitos y confirmar interés",
      "En evaluación": "Evaluar capacidad técnica y riesgos",
      Observaciones: "Radicar observaciones al pliego",
      Propuesta: "Consolidar y enviar propuesta económica",
      Presentada: "Consultar resultado de evaluación",
    };
    const action = actions[o.estado];
    if (!action) return o;
    const technical = o.estado === "En evaluación";
    const t: Tarea = { id: `SIM-T-${o.id}`, tarea: `${action} · Simulado`, area: technical ? "Área técnica" : "Comercial", responsable: technical ? "Andrea Rojas" : o.responsable, limite: o.vence, estado: "Pendiente" };
    return { ...o, tareas: [...o.tareas, t] };
  });
  const pending = active.filter((o) => o.estado === "En evaluación" || o.estado === "Propuesta").map((o) => ({
    id: `SIM-PEND-${o.id}`, clienteId: o.clienteId, oportunidadId: o.id,
    fecha: o.vence.split("-").reverse().join("/"), texto: `Seguimiento comercial: ${o.proceso} · Simulado`,
  }));
  const running = d.proyectos.filter((p) => p.estado === "En ejecución");
  const cases = running.flatMap((p, i) => {
    const o = oportunidades.find((o) => o.id === `OP-${p.id}` && o.clienteId === p.clienteId);
    if (!o) return [];
    return [{ id: `SIM-PQR-${p.id}`, clienteId: p.clienteId, oportunidadId: o.id,
      asunto: `${["Revisar tiempos de respuesta", "Validar entrega del informe mensual", "Atender solicitud de ajuste", "Confirmar cierre de incidente"][i % 4]} · Simulado`,
      estado: i % 2 === 0 ? "Abierta" as const : "En gestión" as const,
      ans: "48 h · Simulado", ans_horas: 48, fuente: "ISSA · Simulado", responsable: o.proyecto?.lider || "Juan Martínez",
    }];
  });
  const profiles = [
    ["Juan Martínez", "Líder de proyecto", 10],
    ["Andrea Rojas", "Arquitecta de software", 8],
    ["Carlos Gómez", "Supervisor financiero", 12],
    ["Diana Castro", "Científica de datos", 6],
    ["Felipe Herrera", "Ingeniero DevOps", 7],
    ["Natalia Suárez", "Experta en ciberseguridad", 9],
  ] as const;
  const equipo: Persona[] = d.equipo.length ? d.equipo : profiles.map(([nombre, perfil, experiencia], i) => ({
    id: `SIM-EQ-${i}`, nombre, perfil: `${perfil} · Simulado`, experiencia,
    proyectoId: i < 3 ? running[i]?.id ?? "" : "",
  }));
  return { ...d, inboxSeedVersion: 1, oportunidades, equipo,
    pendientes: [...d.pendientes, ...pending.filter((p) => !d.pendientes.some((x) => x.id === p.id))],
    pqr: [...d.pqr, ...cases.filter((p) => !d.pqr.some((x) => x.id === p.id))],
  };
}