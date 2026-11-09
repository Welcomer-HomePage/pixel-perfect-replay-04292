import { useState } from "react";
import { toast } from "sonner";
import { X, Phone, Users, Mail, MoreHorizontal } from "lucide-react";
import { USUARIOS, agregarInteraccion, useDb } from "@/lib/data";

const TIPOS = [{ l: "Llamada", I: Phone }, { l: "Reunión", I: Users }, { l: "Correo", I: Mail }, { l: "Otro", I: MoreHorizontal }];

export function InteraccionPanel({ abierto, onCerrar, clienteId, oportunidadId }: { abierto: boolean; onCerrar: () => void; clienteId?: string; oportunidadId?: string }) {
  const db = useDb();
  const hoy = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({
    cliente: clienteId ?? db.clientes[0]!.id,
    oportunidad: oportunidadId ?? "",
    tipo: "Llamada", fecha: hoy, responsable: "Luisa Pérez",
    participantes: "", descripcion: "", seguimiento: false, proxFecha: "", proxDesc: "",
  });
  const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));
  if (!abierto) return null;

  const opsDelCliente = db.oportunidades.filter((o) => o.clienteId === f.cliente);

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.descripcion.trim()) { toast.error("Escribe la descripción de la interacción"); return; }
    if (f.seguimiento && (!f.proxFecha || !f.proxDesc.trim())) { toast.error("Completa la próxima acción"); return; }
    agregarInteraccion(
      f.cliente, f.oportunidad || undefined,
      { tipo: f.tipo, fecha: f.fecha, responsable: f.responsable, participantes: f.participantes, descripcion: f.descripcion },
      f.seguimiento ? { fecha: f.proxFecha, descripcion: f.proxDesc } : undefined,
    );
    toast.success(f.seguimiento ? "Interacción guardada y pendiente creado" : "Interacción guardada correctamente");
    onCerrar();
  };

  const label = "section-title mb-1.5 block text-xs";
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/40" onClick={onCerrar}>
      <aside className="h-full w-full max-w-md overflow-y-auto bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-wine">Registrar interacción</h2>
          <button aria-label="Cerrar" onClick={onCerrar} className="rounded-md p-1 hover:bg-accent"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={guardar} className="mt-5 space-y-4">
          <div><label className={label}>Cliente</label>
            <select className="field" value={f.cliente} onChange={(e) => setF((p) => ({ ...p, cliente: e.target.value, oportunidad: "" }))}>
              {db.clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div><label className={label}>Oportunidad</label>
            <select className="field" value={f.oportunidad} onChange={(e) => set("oportunidad", e.target.value)}>
              <option value="">Sin oportunidad vinculada</option>
              {opsDelCliente.map((o) => <option key={o.id} value={o.id}>{o.proceso}</option>)}
            </select>
          </div>
          <div><span className={label}>Tipo de interacción</span>
            <div className="grid grid-cols-4 gap-2">
              {TIPOS.map(({ l, I }) => (
                <button type="button" key={l} onClick={() => set("tipo", l)} className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 text-xs font-semibold ${f.tipo === l ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary"}`}>
                  <I className="h-4 w-4" />{l}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 grid-cols-2">
            <div><label className={label}>Fecha</label><input type="date" className="field" value={f.fecha} onChange={(e) => set("fecha", e.target.value)} /></div>
            <div><label className={label}>Responsable</label>
              <select className="field" value={f.responsable} onChange={(e) => set("responsable", e.target.value)}>{USUARIOS.map((u) => <option key={u}>{u}</option>)}</select>
            </div>
          </div>
          <div><label className={label}>Participantes</label><input className="field" placeholder="Ej. Gerente de TI" value={f.participantes} onChange={(e) => set("participantes", e.target.value)} /></div>
          <div><label className={label}>Descripción</label><textarea rows={4} className="field" value={f.descripcion} onChange={(e) => set("descripcion", e.target.value)} /></div>
          <label className="flex items-center gap-2 font-medium">
            <input type="checkbox" className="h-4 w-4 accent-primary" checked={f.seguimiento} onChange={(e) => set("seguimiento", e.target.checked)} /> Requiere seguimiento
          </label>
          {f.seguimiento && (
            <div className="grid gap-4 rounded-lg border border-primary/30 bg-card p-4">
              <div><label className={label}>Fecha de la próxima acción</label><input type="date" className="field" value={f.proxFecha} onChange={(e) => set("proxFecha", e.target.value)} /></div>
              <div><label className={label}>Descripción de la próxima acción</label><input className="field" value={f.proxDesc} onChange={(e) => set("proxDesc", e.target.value)} /></div>
            </div>
          )}
          <div className="flex gap-3">
            <button className="rounded-md bg-primary px-6 py-2.5 font-semibold text-primary-foreground hover:bg-wine">Guardar</button>
            <button type="button" onClick={onCerrar} className="rounded-md border px-6 py-2.5 font-semibold hover:bg-accent">Cancelar</button>
          </div>
        </form>
      </aside>
    </div>
  );
}
