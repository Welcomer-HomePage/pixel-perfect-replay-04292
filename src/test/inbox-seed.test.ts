import { describe, expect, it } from "vitest";
import { getDb, hydrateDb, loadRealTci, replaceDb } from "@/lib/data";
import { populateInbox } from "@/lib/inbox-seed";
import { scopedDb, type Session } from "@/lib/auth";
import { username } from "@/lib/workbook";

describe("Mi bandeja poblada", () => {
  it("vincula los cuatro casos simulados a contratos en ejecución y oportunidades existentes", async () => {
    await loadRealTci();
    const d = getDb();
    expect(d.pqr).toHaveLength(4);
    for (const p of d.pqr) {
      expect(d.oportunidades.find((o) => o.id === p.oportunidadId)?.clienteId).toBe(p.clienteId);
      expect(d.proyectos.find((x) => `SIM-PQR-${x.id}` === p.id)?.estado).toBe("En ejecución");
      expect(p.fuente).toBe("ISSA · Simulado");
    }
  });
  it("provee pendientes para cada perfil sin mostrar tareas ajenas", async () => {
    await loadRealTci();
    const d = getDb();
    for (const user of d.usuarios) {
      const s: Session = { nombre: user.nombre, usuario: username(user.nombre), rol: user.rol, viewAs: user.rol };
      const visible = scopedDb(d, s);
      if (user.rol === "Recursos Humanos") expect(visible.equipo).toHaveLength(6);
      else if (user.rol === "Líder de proyecto") expect(visible.pqr).toHaveLength(4);
      else if (user.rol === "Líder Comercial") expect(visible.pendientes).toHaveLength(2);
      else expect(visible.oportunidades.flatMap((o) => o.aprobaciones).filter((a) => a.tipo === (user.rol === "Gerente de área" ? "Aprobación técnica" : "Aprobación de presupuesto"))).toHaveLength(1);
    }
  });
  it("no duplica ni reactiva pendientes resueltos al recargar", async () => {
    await loadRealTci();
    const d = getDb();
    replaceDb({ ...d, pqr: d.pqr.map((p) => ({ ...p, estado: "Cerrada" })), oportunidades: d.oportunidades.map((o) => ({ ...o, tareas: o.tareas.map((t) => ({ ...t, estado: "Listo" })) })) });
    await hydrateDb();
    expect(getDb().pqr).toHaveLength(4);
    expect(getDb().pqr.every((p) => p.estado === "Cerrada")).toBe(true);
    expect(getDb().oportunidades.flatMap((o) => o.tareas).every((t) => t.estado === "Listo")).toBe(true);
  });
  it("completa una carga real anterior una sola vez sin sustituir registros", async () => {
    await loadRealTci();
    const { inboxSeedVersion: _version, ...d } = getDb();
    const prior = { ...d, pqr: [], pendientes: [], equipo: [] };
    const filled = populateInbox(prior);
    expect(filled.pqr).toHaveLength(4);
    expect(filled.proyectos).toBe(prior.proyectos);
    expect(populateInbox(filled)).toBe(filled);
  });
  it("no puebla archivos importados", async () => {
    await loadRealTci();
    const { inboxSeedVersion: _version, ...d } = getDb();
    const imported = { ...d, origen: { ...d.origen, archivo: "Mi archivo.xlsx" }, pqr: [], pendientes: [], equipo: [] };
    expect(populateInbox(imported)).toBe(imported);
  });
});