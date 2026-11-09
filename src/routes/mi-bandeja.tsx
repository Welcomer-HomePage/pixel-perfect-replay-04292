import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Migas } from "@/components/AppShell";
import { EQUIPO_ESPECIALIZADO, clienteDe, cop, opDe, useDb, useRol, venceHoy } from "@/lib/data";

export const Route = createFileRoute("/mi-bandeja")({
  head: () => ({
    meta: [
      { title: "Mi bandeja · TCI Gestión de Clientes" },
      { name: "description", content: "Tareas, aprobaciones, propuestas por vencer y PQR pendientes según tu rol." },
      { property: "og:title", content: "Mi bandeja · TCI" },
      { property: "og:description", content: "Pendientes del rol seleccionado." },
    ],
  }),
  component: MiBandeja,
});

type Item = { texto: string; detalle: string; opId: string; paso: number };

function MiBandeja() {
  const db = useDb();
  const rol = useRol();
  const items: Item[] = [];

  if (rol === "Líder Comercial") {
    db.oportunidades.filter(venceHoy).forEach((o) => items.push({ texto: `Propuesta por vencer hoy: ${o.proceso}`, detalle: `${clienteDe(db, o.clienteId)?.nombre} · ${cop(o.valor)}`, opId: o.id, paso: 4 }));
    db.oportunidades.filter((o) => o.estado === "Identificada").forEach((o) => items.push({ texto: `Oportunidad sin atender: ${o.proceso}`, detalle: clienteDe(db, o.clienteId)?.nombre ?? "", opId: o.id, paso: 1 }));
  }
  if (rol === "Gerente de área" || rol === "Gerencia Administrativa") {
    db.oportunidades.forEach((o) => o.aprobaciones.filter((a) => a.estado === "Pendiente").forEach((a) => {
      if (rol === "Gerencia Administrativa" && a.tipo !== "Aprobación de presupuesto") return;
      items.push({ texto: `${a.tipo}: ${o.proceso}`, detalle: `Solicita ${a.solicitante} · ${clienteDe(db, o.clienteId)?.nombre}`, opId: o.id, paso: 3 });
    }));
  }
  if (rol === "Líder de proyecto") {
    db.pqr.filter((p) => p.estado !== "Cerrada").forEach((p) => {
      const op = p.oportunidadId ? opDe(db, p.oportunidadId) : db.oportunidades.find((o) => o.clienteId === p.clienteId && o.estado === "Ganada");
      if (op) items.push({ texto: `PQR por atender: ${p.asunto}`, detalle: `${p.id} · ${clienteDe(db, p.clienteId)?.nombre} · ANS: ${p.ans}`, opId: op.id, paso: 5 });
    });
    db.oportunidades.forEach((o) => o.tareas.filter((t) => t.responsable === "Juan Martínez" && t.estado !== "Listo").forEach((t) =>
      items.push({ texto: `Tarea asignada: ${t.tarea}`, detalle: `${o.proceso} · Límite ${t.limite.split("-").reverse().join("/")}`, opId: o.id, paso: 3 })));
  }

  return (
    <AppShell>
      <Migas items={[{ label: "Tablero", to: "/" }, { label: "Mi bandeja" }]} />
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-wine">Mi bandeja</h1>
      <p className="text-muted-foreground">Pendientes del rol <strong>{rol}</strong>. Cada ítem abre el paso exacto de la oportunidad.</p>

      {rol === "Recursos Humanos" ? (
        <div className="mt-6 overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-primary text-left text-primary-foreground">
              <tr>{["Nombre", "Perfil", "Experiencia", "Estado"].map((h) => <th key={h} className="px-4 py-3 font-display uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody>
              {EQUIPO_ESPECIALIZADO.map((p) => (
                <tr key={p.nombre} className="border-t">
                  <td className="px-4 py-3 font-semibold">{p.nombre}</td><td className="px-4 py-3">{p.perfil}</td><td className="px-4 py-3">{p.experiencia}</td>
                  <td className="px-4 py-3">{p.asignado
                    ? <span className="rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-semibold text-warning-foreground">Asignado · {p.asignado}</span>
                    : <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">Libre</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 divide-y rounded-xl border bg-card">
          {items.length === 0 && <p className="p-5 text-muted-foreground">No tienes pendientes. ¡Buen trabajo!</p>}
          {items.map((it, i) => (
            <Link key={i} to="/oportunidades/$id" params={{ id: it.opId }} search={{ paso: it.paso }} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-accent">
              <div>
                <p className="font-semibold">{it.texto}</p>
                <p className="text-sm text-muted-foreground">{it.detalle}</p>
              </div>
              <span className="whitespace-nowrap rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">Paso {it.paso} →</span>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
