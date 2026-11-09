import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Upload, RefreshCw } from "lucide-react";
import { AppShell, Migas } from "@/components/AppShell";
import { FUENTES, importarOportunidades } from "@/lib/data";

export const Route = createFileRoute("/integraciones")({
  head: () => ({
    meta: [
      { title: "Integraciones · TCI Gestión de Clientes" },
      { name: "description", content: "Fuentes de datos sincronizadas e importación de procesos desde portales de entidades." },
      { property: "og:title", content: "Integraciones · TCI" },
      { property: "og:description", content: "Fuentes de datos e importación de procesos." },
    ],
  }),
  component: Integraciones,
});

function Integraciones() {
  const importar = () => {
    const n = importarOportunidades();
    if (n === 0) { toast.info("No hay procesos nuevos en el archivo"); return; }
    toast.success(`${n} procesos importados desde portales_entidades.xlsx`);
  };

  return (
    <AppShell>
      <Migas items={[{ label: "Tablero", to: "/" }, { label: "Integraciones" }]} />
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-wine">Integraciones</h1>
      <p className="text-muted-foreground">Fuentes que alimentan la Vista 360° y el tablero de oportunidades.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FUENTES.map((f) => (
          <div key={f.nombre} className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-bold text-primary">{f.nombre}</p>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Última sincronización</p>
            <p className="font-semibold">{f.sync}</p>
            <p className="mt-2 inline-flex rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">Conectada</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border bg-card p-6">
        <h2 className="section-title mb-2">Importar procesos desde portales</h2>
        <p className="text-sm text-muted-foreground">Los portales de las entidades no exponen API; la carga se hace por archivo o por agente.</p>
        <button onClick={importar} className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 font-semibold text-primary-foreground hover:bg-wine">
          <Upload className="h-4 w-4" /> Importar desde portales
        </button>
        <p className="mt-2 text-xs text-muted-foreground">Simula la carga de <code>portales_entidades.xlsx</code>: los procesos nuevos aparecen en la etapa Identificar del tablero.</p>
      </div>
    </AppShell>
  );
}
