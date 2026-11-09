import { describe, it, expect } from "vitest";
import { importarCsv } from "@/lib/data";

describe("importarCsv", () => {
  it("crea oportunidades en Identificar para filas válidas", () => {
    const r = importarCsv("entidad,proceso,valor,vence\nIDU,Proceso prueba CSV,300,2026-12-01\n");
    expect(r.creadas).toBe(1);
  });
  it("rechaza entidades que no son clientes", () => {
    const r = importarCsv("entidad,proceso,valor,vence\nNoExiste SA,X,100,2026-12-01\n");
    expect(r.creadas).toBe(0);
    expect(r.errores.length).toBe(1);
  });
});
