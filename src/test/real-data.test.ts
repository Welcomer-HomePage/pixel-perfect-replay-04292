import { describe, it, expect } from "vitest";
import { emptyDb, getDb, hydrateDb, loadRealTci, replaceDb, restoreDemo } from "@/lib/data";
import { experienceTotals } from "@/lib/experience";
import { exportRows, readWorkbook, reviewWorkbook } from "@/lib/workbook";
import * as XLSX from "xlsx";

describe("Datos reales de TCI", () => {
  it("carga 16 clientes y 36 proyectos", async () => {
    await loadRealTci();
    expect(getDb().clientes).toHaveLength(16);
    expect(getDb().proyectos).toHaveLength(36);
  });
  it("deriva 7 proyectos FNA y 9 Caja Social", async () => {
    await loadRealTci();
    expect(getDb().clientes.find((c) => c.id === "CLI-006")?.historicos).toBe(7);
    expect(getDb().clientes.find((c) => c.id === "CLI-005")?.historicos).toBe(9);
  });
  it("conserva COP íntegros y totaliza contratos cerrados sin ponderar participación", async () => {
    await loadRealTci();
    expect(getDb().proyectos.find((p) => p.id === "P-022")?.valor_contrato_cop).toBe(320853764);
    expect(getDb().proyectos.find((p) => p.id === "P-031")?.valor_contrato_cop).toBe(1019624548);
    expect(experienceTotals(getDb().proyectos).cerrados).toBe(16932708306);
  });
  it.each([["P-025", .5], ["P-026", .5], ["P-027", .2], ["P-031", .06]] as const)("guarda participación de %s", async (id, value) => {
    await loadRealTci();
    expect(getDb().proyectos.find((p) => p.id === id)?.porcentaje_participacion).toBe(value);
  });
  it("los demás contratos tienen participación de 100%", async () => {
    await loadRealTci();
    const ordinary = getDb().proyectos.filter((p) => !["P-025", "P-026", "P-027", "P-031"].includes(p.id));
    expect(ordinary).toHaveLength(32);
    expect(ordinary.every((p) => p.porcentaje_participacion === 1)).toBe(true);
  });
  it("no inventa RUP 33 ni SMMLV para los 4 contratos en ejecución", async () => {
    await loadRealTci();
    expect(getDb().proyectos.some((p) => p.id === "P-033")).toBe(false);
    const running = getDb().proyectos.filter((p) => p.estado === "En ejecución");
    expect(running.map((p) => p.id)).toEqual(["P-034", "P-035", "P-036", "P-037"]);
    expect(running.map((p) => p.valor_smmlv)).toEqual([null, null, null, null]);
    expect(experienceTotals(running).smmlv).toBe(0);
    expect(experienceTotals(getDb().proyectos).smmlv).toBeCloseTo(16499.365, 3);
  });
  it("puebla el tablero con los 36 contratos ganados y un pipeline activo", async () => {
    await loadRealTci();
    const ops = getDb().oportunidades;
    expect(ops.filter((o) => o.estado === "Ganada")).toHaveLength(36);
    expect(ops.filter((o) => o.estado !== "Ganada")).toHaveLength(8);
    for (const p of getDb().proyectos) {
      const op = ops.find((o) => o.id === `OP-${p.id}`);
      expect(op?.clienteId).toBe(p.clienteId);
      expect(op?.proceso).toBe(p.nombre);
    }
    expect(getDb().pendientes).toHaveLength(2);
    expect(getDb().pqr).toHaveLength(4);
  });
  it("inicializa un navegador nuevo y un store vacío", async () => {
    localStorage.removeItem("tci-db-v3");
    await hydrateDb();
    expect(getDb().proyectos).toHaveLength(36);
    replaceDb(emptyDb());
    await hydrateDb();
    expect(getDb().clientes).toHaveLength(16);
  });
  it("restaura el ejemplo anterior y no lo sustituye al recargar", async () => {
    restoreDemo();
    const ids = getDb().oportunidades.map((o) => o.id);
    expect(ids).toContain("op-fna-mesa");
    await hydrateDb();
    expect(getDb().oportunidades.map((o) => o.id)).toEqual(ids);
  });
  it("Excel puede complementar o reemplazar la carga real y persiste al recargar", async () => {
    await loadRealTci();
    const w = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(w, XLSX.utils.aoa_to_sheet([
      ["id_cliente", "nombre", "tipo_cliente"], ["CLI-NEW", "Nuevo", "Privado"],
    ]), "Clientes");
    const grids = readWorkbook(XLSX.write(w, { type: "array", bookType: "xlsx" }) as ArrayBuffer);
    const merged = reviewWorkbook(grids, "merge", getDb(), "Nuevo.xlsx");
    expect(merged.data.clientes).toHaveLength(17);
    expect(merged.data.proyectos).toHaveLength(36);
    const replaced = reviewWorkbook(grids, "replace", getDb(), "Nuevo.xlsx");
    replaceDb(replaced.data);
    await hydrateDb();
    expect(getDb().clientes.map((c) => c.id)).toEqual(["CLI-NEW"]);
    expect(getDb().proyectos).toHaveLength(0);
  });
  it("exporta COP y participación sin conversión", async () => {
    await loadRealTci();
    const row = exportRows(getDb())["Proyectos"]?.find((p) => p["id_proyecto"] === "P-031");
    expect(row?.["valor_contrato_cop"]).toBe(1019624548);
    expect(row?.["porcentaje_participacion"]).toBe(.06);
  });
});