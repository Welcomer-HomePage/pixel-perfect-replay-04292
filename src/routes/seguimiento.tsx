import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Phone, Users, Mail, MoreHorizontal } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { USUARIOS, agregarInteraccion, useClientes } from "@/lib/data";

export const Route = createFileRoute("/seguimiento")({
  validateSearch: (s: Record<string, unknown>): { cliente?: string } => ({ cliente: typeof s.cliente === "string" ? s.cliente : undefined }),
  head: () => ({
    meta: [
      { title: "Registrar seguimiento · TCI" },
      { name: "description", content: "Registra llamadas, reuniones y correos con tus clientes." },
      { property: "og:title", content: "Registrar seguimiento · TCI" },
      { property: "og:description", content: "Registra interacciones con clientes." },
    ],
  }),
  component: Seguimiento,
});

const TIPOS = [{ l: "Llamada", I: Phone }, { l: "Reunión", I: Users }, { l: "Correo", I: Mail }, { l: "Otro", I: MoreHorizontal }];

function Seguimiento() {
  const { cliente } = Route.useSearch();
  const clientes = useClientes();
  const navigate = useNavigate();
  const router = useRouter();
  const hoy = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ cliente: cliente ?? clientes[0].id, tipo: "Llamada", fecha: hoy, responsable: "Luisa Pérez", participantes: "", descripcion: "", seguimiento: false, proxFecha: "", proxDesc: "" });
  const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.descripcion.trim()) { toast.error("Escribe la descripción de la interacción"); return; }
    if (f.seguimiento && (!f.proxFecha || !f.proxDesc.trim())) { toast.error("Completa la próxima acción"); return; }
    agregarInteraccion(f.cliente, {
      tipo: f.tipo, fecha: f.fecha, responsable: f.responsable, participantes: f.participantes, descripcion: f.descripcion,
      proxima: f.seguimiento ? { fecha: f.proxFecha, descripcion: f.proxDesc } : undefined,
    });
    toast.success("Interacción guardada correctamente");
    navigate({ to: "/clientes/$id", params: { id: f.cliente } });
  };

  const label = "section-title mb-1.5 block text-xs";
  return (
    <AppShell>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-wine">Registrar seguimiento</h1>
      <form onSubmit={guardar} className="mt-6 max-w-2xl space-y-5 rounded-xl border bg-card p-6">
        <div><label className={label}>Cliente</label>
          <select className="field" value={f.cliente} onChange={(e) => set("cliente", e.target.value)}>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div><span className={label}>Tipo de interacción</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TIPOS.map(({ l, I }) => (
              <button type="button" key={l} onClick={() => set("tipo", l)} className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-sm font-semibold ${f.tipo === l ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary"}`}>
                <I className="h-5 w-5" />{l}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className={label}>Fecha</label><input type="date" className="field" value={f.fecha} onChange={(e) => set("fecha", e.target.value)} /></div>
          <div><label className={label}>Responsable</label>
            <select className="field" value={f.responsable} onChange={(e) => set("responsable", e.target.value)}>{USUARIOS.map((u) => <option key={u}>{u}</option>)}</select>
          </div>
        </div>
        <div><label className={label}>Participantes</label><input className="field" placeholder="Ej. Gerente de TI, Director de compras" value={f.participantes} onChange={(e) => set("participantes", e.target.value)} /></div>
        <div><label className={label}>Descripción de la interacción</label><textarea rows={4} className="field" value={f.descripcion} onChange={(e) => set("descripcion", e.target.value)} /></div>
        <label className="flex items-center gap-2 font-medium">
          <input type="checkbox" className="h-4 w-4 accent-primary" checked={f.seguimiento} onChange={(e) => set("seguimiento", e.target.checked)} /> Requiere seguimiento
        </label>
        {f.seguimiento && (
          <div className="grid gap-4 rounded-lg border border-primary/30 bg-background p-4 sm:grid-cols-2">
            <div><label className={label}>Fecha de la próxima acción</label><input type="date" className="field" value={f.proxFecha} onChange={(e) => set("proxFecha", e.target.value)} /></div>
            <div><label className={label}>Descripción de la próxima acción</label><input className="field" value={f.proxDesc} onChange={(e) => set("proxDesc", e.target.value)} /></div>
          </div>
        )}
        <div className="flex gap-3">
          <button className="rounded-md bg-primary px-6 py-2.5 font-semibold text-primary-foreground hover:bg-wine">Guardar</button>
          <button type="button" onClick={() => router.history.back()} className="rounded-md border px-6 py-2.5 font-semibold hover:bg-accent">Cancelar</button>
        </div>
      </form>
    </AppShell>
  );
}
