import { useState } from "react";
import { toast } from "sonner";
import { useRol, EQUIPO_ESPECIALIZADO, APROBACIONES, PQR_ASIGNADAS } from "@/lib/data";

const th = "px-4 py-3 font-display uppercase tracking-wider";
const td = "px-4 py-3";

function Tabla({ cols, children }: { cols: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-primary text-left text-primary-foreground"><tr>{cols.map((c) => <th key={c} className={th}>{c}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function RolPanel() {
  const rol = useRol();
  const [aprob, setAprob] = useState(APROBACIONES);

  if (rol === "Recursos Humanos") {
    return (
      <section className="mb-8">
        <div className="mb-3 flex gap-1 border-b">
          <span className="border-b-2 border-primary px-4 py-2 font-display text-sm font-bold uppercase tracking-wider text-primary">Disponibilidad del equipo especializado</span>
        </div>
        <Tabla cols={["Nombre", "Perfil", "Experiencia", "Estado"]}>
          {EQUIPO_ESPECIALIZADO.map((p) => (
            <tr key={p.nombre} className="border-t">
              <td className={`${td} font-semibold`}>{p.nombre}</td><td className={td}>{p.perfil}</td><td className={td}>{p.experiencia}</td>
              <td className={td}>{p.asignado
                ? <span className="rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-semibold text-warning-foreground">Asignado · {p.asignado}</span>
                : <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">Libre</span>}</td>
            </tr>
          ))}
        </Tabla>
      </section>
    );
  }
  if (rol === "Gerente de área") {
    return (
      <section className="mb-8">
        <h2 className="section-title mb-3">Mis aprobaciones pendientes ({aprob.length})</h2>
        <Tabla cols={["ID", "Proceso", "Tipo", "Solicitante", "Fecha", ""]}>
          {aprob.map((a) => (
            <tr key={a.id} className="border-t">
              <td className={`${td} font-semibold`}>{a.id}</td><td className={td}>{a.proceso}</td><td className={td}>{a.tipo}</td><td className={td}>{a.solicitante}</td><td className={td}>{a.fecha}</td>
              <td className={`${td} whitespace-nowrap`}>
                <button onClick={() => { setAprob((x) => x.filter((y) => y.id !== a.id)); toast.success(`${a.id} aprobada`); }} className="mr-2 rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-wine">Aprobar</button>
                <button onClick={() => { setAprob((x) => x.filter((y) => y.id !== a.id)); toast.error(`${a.id} rechazada`); }} className="rounded-md border border-primary px-3 py-1 text-xs font-semibold text-primary hover:bg-accent">Rechazar</button>
              </td>
            </tr>
          ))}
          {aprob.length === 0 && <tr><td colSpan={6} className={`${td} text-muted-foreground`}>No tienes aprobaciones pendientes.</td></tr>}
        </Tabla>
      </section>
    );
  }
  if (rol === "Líder de proyecto") {
    return (
      <section className="mb-8">
        <h2 className="section-title mb-3">Mis PQR asignadas</h2>
        <Tabla cols={["ID", "Cliente", "Asunto", "Estado", "ANS"]}>
          {PQR_ASIGNADAS.map((p) => (
            <tr key={p.id} className="border-t">
              <td className={`${td} font-semibold`}>{p.id}</td><td className={td}>{p.cliente}</td><td className={td}>{p.asunto}</td><td className={td}>{p.estado}</td>
              <td className={`${td} ${p.ans === "Vencido" ? "font-bold text-destructive" : ""}`}>{p.ans}</td>
            </tr>
          ))}
        </Tabla>
      </section>
    );
  }
  return null;
}
