import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { USUARIOS } from "@/lib/data";

export const Route = createFileRoute("/licitaciones")({
  head: () => ({
    meta: [
      { title: "Licitaciones y responsables · TCI" },
      { name: "description", content: "Seguimiento de procesos de licitación, etapas, responsables y vencimientos." },
      { property: "og:title", content: "Licitaciones y responsables · TCI" },
      { property: "og:description", content: "Procesos de licitación y sus responsables." },
    ],
  }),
  component: Licitaciones,
});

type Proc = { proceso: string; entidad: string; tipo: string; etapa: string; responsable: string; vence: string };
const INICIAL: Proc[] = [
  { proceso: "IDU · Software misional", entidad: "IDU", tipo: "Público", etapa: "Observaciones", responsable: "Área técnica", vence: "03/11" },
  { proceso: "FNA · Mesa de ayuda", entidad: "FNA", tipo: "Público", etapa: "Propuesta", responsable: "Área financiera", vence: "Hoy" },
  { proceso: "Ecopetrol · Leasing", entidad: "Ecopetrol", tipo: "Mixto", etapa: "Ganado", responsable: "Luisa Pérez", vence: "—" },
];
const AREAS = ["Área técnica", "Área financiera", "Área jurídica", "Comercial"];

function Licitaciones() {
  const [procs, setProcs] = useState(INICIAL);
  const [flt, setFlt] = useState({ entidad: "", tipo: "", etapa: "" });
  const [aplicado, setAplicado] = useState(flt);
  const [a, setA] = useState({ proceso: INICIAL[0].proceso, area: AREAS[0], responsable: USUARIOS[0], fecha: "", notificar: true });

  const lista = procs.filter((p) => (!aplicado.entidad || p.entidad === aplicado.entidad) && (!aplicado.tipo || p.tipo === aplicado.tipo) && (!aplicado.etapa || p.etapa === aplicado.etapa));
  const sinAtender = procs.filter((p) => p.etapa === "Observaciones").length + 1;
  const hoy = procs.filter((p) => p.vence === "Hoy").length;
  const ganados = procs.filter((p) => p.etapa === "Ganado").length;

  const asignar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!a.fecha) { toast.error("Selecciona una fecha límite"); return; }
    const v = a.fecha.split("-").reverse().slice(0, 2).join("/");
    setProcs((ps) => ps.map((p) => (p.proceso === a.proceso ? { ...p, responsable: `${a.responsable} (${a.area})`, vence: v } : p)));
    toast.success(`Responsable asignado: ${a.responsable}${a.notificar ? " · Notificación enviada por correo y en la app" : ""}`);
  };

  const label = "section-title mb-1.5 block text-xs";
  return (
    <AppShell>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-wine">Licitaciones y responsables</h1>
      <div className="mt-5 flex items-center gap-3 rounded-lg border border-warning bg-warning-soft px-4 py-3 font-semibold text-warning-foreground">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        {sinAtender} requerimientos sin atender · {hoy} propuesta{hoy !== 1 && "s"} vence{hoy !== 1 && "n"} hoy · {ganados} proceso{ganados !== 1 && "s"} ganado{ganados !== 1 && "s"}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); setAplicado(flt); }} className="mt-6 grid gap-3 sm:grid-cols-4">
        <select className="field" value={flt.entidad} onChange={(e) => setFlt({ ...flt, entidad: e.target.value })}><option value="">Entidad: todas</option>{["IDU", "FNA", "Ecopetrol"].map((x) => <option key={x}>{x}</option>)}</select>
        <select className="field" value={flt.tipo} onChange={(e) => setFlt({ ...flt, tipo: e.target.value })}><option value="">Tipo de cliente: todos</option>{["Público", "Mixto", "Privado"].map((x) => <option key={x}>{x}</option>)}</select>
        <select className="field" value={flt.etapa} onChange={(e) => setFlt({ ...flt, etapa: e.target.value })}><option value="">Estado: todos</option>{["Observaciones", "Propuesta", "Ganado"].map((x) => <option key={x}>{x}</option>)}</select>
        <button className="rounded-md bg-primary font-semibold text-primary-foreground hover:bg-wine">Buscar</button>
      </form>

      <div className="mt-5 overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-primary text-left text-primary-foreground">
            <tr>{["Proceso", "Etapa", "Responsable", "Vence"].map((h) => <th key={h} className="px-4 py-3 font-display uppercase tracking-wider">{h}</th>)}</tr>
          </thead>
          <tbody>
            {lista.map((p) => (
              <tr key={p.proceso} className={`border-t ${p.vence === "Hoy" ? "bg-accent" : ""}`}>
                <td className="px-4 py-3 font-semibold">{p.proceso}</td>
                <td className="px-4 py-3">{p.etapa}</td>
                <td className="px-4 py-3">{p.responsable}</td>
                <td className={`px-4 py-3 ${p.vence === "Hoy" ? "font-bold text-destructive" : ""}`}>{p.vence}</td>
              </tr>
            ))}
            {lista.length === 0 && <tr><td colSpan={4} className="px-4 py-5 text-muted-foreground">No hay procesos con esos filtros.</td></tr>}
          </tbody>
        </table>
      </div>

      <form onSubmit={asignar} className="mt-8 rounded-xl border bg-card p-6">
        <h2 className="section-title mb-4">Asignar responsable</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div><label className={label}>Proceso</label><select className="field" value={a.proceso} onChange={(e) => setA({ ...a, proceso: e.target.value })}>{procs.map((p) => <option key={p.proceso}>{p.proceso}</option>)}</select></div>
          <div><label className={label}>Área</label><select className="field" value={a.area} onChange={(e) => setA({ ...a, area: e.target.value })}>{AREAS.map((x) => <option key={x}>{x}</option>)}</select></div>
          <div><label className={label}>Responsable</label><select className="field" value={a.responsable} onChange={(e) => setA({ ...a, responsable: e.target.value })}>{USUARIOS.map((x) => <option key={x}>{x}</option>)}</select></div>
          <div><label className={label}>Fecha límite</label><input type="date" className="field" value={a.fecha} onChange={(e) => setA({ ...a, fecha: e.target.value })} /></div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 font-medium"><input type="checkbox" className="h-4 w-4 accent-primary" checked={a.notificar} onChange={(e) => setA({ ...a, notificar: e.target.checked })} /> Notificar por correo y en la app</label>
          <button className="rounded-md bg-primary px-6 py-2.5 font-semibold text-primary-foreground hover:bg-wine">Asignar</button>
        </div>
      </form>
    </AppShell>
  );
}
