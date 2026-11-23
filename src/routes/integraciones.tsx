import { Button } from "@/components/ui/button";
import { isAdmin, useSession } from "@/lib/auth";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, RefreshCw, ArrowRight, ArrowLeft, ArrowLeftRight, Download, X } from "lucide-react";
import { AppShell, Migas } from "@/components/AppShell";
import { CSV_EJEMPLO, importarCsv, sincronizar, useSyncs, type IntegracionId } from "@/lib/data";

export const Route = createFileRoute("/integraciones")({
  head: () => ({
    meta: [
      { title: "Integraciones · TCI Gestión de Clientes" },
      { name: "description", content: "Cómo se conectan ISSA, Microsoft Forms, Siigo, SharePoint y los portales de licitación con la gestión de oportunidades de TCI." },
      { property: "og:title", content: "Integraciones · TCI" },
      { property: "og:description", content: "Fuentes de datos, mapeo de campos, importación CSV y plan de implementación." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Integraciones,
});

type Estado = "Conectado" | "Simulado" | "Pendiente";
type Integ = {
  id: IntegracionId; nombre: string; proposito: string; estado: Estado;
  direccion: "Entrada" | "Salida" | "Bidireccional"; canal: string; datos: string[];
  frecuencia: string; alimenta: string; mapeo: [string, string][];
};

const INTEGRACIONES: Integ[] = [
  { id: "issa", nombre: "ISSA", proposito: "PQR e incidentes", estado: "Simulado", direccion: "Entrada", canal: "Webhook o API", datos: ["id del caso", "asunto", "estado", "fecha", "ANS"], frecuencia: "En tiempo real (webhook)", alimenta: "Paso 5",
    mapeo: [["case_id", "pqr.id"], ["subject", "pqr.asunto"], ["status", "pqr.estado"], ["created_at", "pqr.fecha"], ["sla_status", "pqr.ans"], ["identification_type", "pqr.tipo_identificacion"], ["identification", "pqr.numero_identificacion (enmascarado)"]] },
  { id: "forms", nombre: "Microsoft Forms", proposito: "Encuestas de satisfacción", estado: "Simulado", direccion: "Entrada", canal: "Power Automate → API", datos: ["cliente", "proyecto", "calificación", "comentarios"], frecuencia: "Al recibir cada respuesta", alimenta: "Paso 5 y Vista 360°",
    mapeo: [["responseId", "encuesta.id"], ["NIT de la entidad", "cliente.nit"], ["Proyecto", "oportunidad.id"], ["Calificación (1-5)", "encuesta.nota"], ["Comentarios", "encuesta.comentario"]] },
  { id: "siigo", nombre: "Siigo", proposito: "Costos, utilidad y facturación por proyecto", estado: "Simulado", direccion: "Entrada", canal: "API de Siigo", datos: ["centro de costo", "costo", "utilidad", "facturado"], frecuencia: "Diaria (23:00)", alimenta: "Pasos 2 y 5",
    mapeo: [["cost_center", "proyecto.id"], ["total_cost", "proyecto.costo"], ["margin", "proyecto.utilidad"], ["invoiced", "proyecto.facturado"], ["customer.identification", "cliente.nit"]] },
  { id: "sharepoint", nombre: "SharePoint y Lists", proposito: "Documentos y matriz de la licitación", estado: "Pendiente", direccion: "Bidireccional", canal: "Microsoft Graph", datos: ["pliegos", "anexos", "matriz de tareas", "responsables"], frecuencia: "Cada 15 minutos", alimenta: "Pasos 3 y 4",
    mapeo: [["driveItem.name", "oportunidad.pliegos[]"], ["listItem.Title", "tarea.tarea"], ["listItem.Area", "tarea.area"], ["listItem.AssignedTo", "tarea.responsable"], ["listItem.DueDate", "tarea.limite"]] },
  { id: "portales", nombre: "Portales de licitación", proposito: "SECOP II y portales propios de las entidades", estado: "Simulado", direccion: "Entrada", canal: "Archivo CSV / Excel o agente", datos: ["entidad", "proceso", "valor", "fecha de cierre", "fuente", "responsable"], frecuencia: "Bajo demanda", alimenta: "Paso 1",
    mapeo: [["Entidad", "cliente.nombre / nit"], ["Objeto del proceso", "oportunidad.proceso"], ["Valor estimado (M COP)", "oportunidad.valor"], ["Fecha de cierre", "oportunidad.vence"], ["Portal", "oportunidad.fuente"], ["Responsable", "oportunidad.responsable"]] },
];

const estiloEstado: Record<Estado, string> = {
  Conectado: "bg-success-soft text-success",
  Simulado: "bg-warning-soft text-warning-foreground",
  Pendiente: "bg-muted text-muted-foreground",
};
const IconoDir = { Entrada: ArrowRight, Salida: ArrowLeft, Bidireccional: ArrowLeftRight };

export function EtiquetaSimulado() {
  return <span className="rounded-full border border-dashed border-primary px-2 py-0.5 text-[11px] font-bold uppercase tracking-normal text-primary">Simulado</span>;
}

function Integraciones() {
  const syncs = useSyncs();
  const session=useSession();
  const [mapeo, setMapeo] = useState<Integ | null>(null);
  const [cargando, setCargando] = useState<IntegracionId | null>(null);
  const [resultado, setResultado] = useState<{ creadas: number; errores: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const sync = (i: Integ) => {
    setCargando(i.id);
    setTimeout(() => {
      const msg = sincronizar(i.id);
      setCargando(null);
      toast.success(`${i.nombre}: ${msg}`);
    }, 900);
  };

  const subir = async (f: File | undefined) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) { toast.error("Por ahora solo se aceptan archivos .csv (exporta tu Excel como CSV)"); return; }
    const r = importarCsv(await f.text());
    setResultado(r);
    if (r.creadas) toast.success(`${r.creadas} oportunidades creadas en Identificar`);
    else toast.error("No se creó ninguna oportunidad");
    if (fileRef.current) fileRef.current.value = "";
  };

  const descargarEjemplo = () => {
    const url = URL.createObjectURL(new Blob([CSV_EJEMPLO], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "licitaciones_ejemplo.csv"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <Migas items={[{ label: "Tablero", to: "/" }, { label: "Integraciones" }]} />
      <h1 className="font-display text-3xl font-bold uppercase tracking-normal text-wine">Integraciones</h1>
      <p className="text-muted-foreground">Cómo se conectarían los sistemas de TCI con el proceso de oportunidades. Lo que no está conectado de verdad lleva la etiqueta <EtiquetaSimulado />.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {INTEGRACIONES.map((i) => {
          const Dir = IconoDir[i.direccion];
          return (
            <div key={i.id} className="flex flex-col rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg font-bold text-primary">{i.nombre}</p>
                  <p className="text-sm text-muted-foreground">{i.proposito}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${estiloEstado[i.estado]}`}>{i.estado}</span>
              </div>
              <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
                <dt className="text-muted-foreground">Flujo</dt>
                <dd className="flex items-center gap-1.5 font-medium"><Dir className="h-4 w-4 text-primary" />{i.direccion} · {i.canal}</dd>
                <dt className="text-muted-foreground">Datos</dt><dd>{i.datos.join(", ")}</dd>
                <dt className="text-muted-foreground">Frecuencia</dt><dd>{i.frecuencia}</dd>
                <dt className="text-muted-foreground">Alimenta</dt><dd className="font-medium">{i.alimenta}</dd>
                <dt className="text-muted-foreground">Última sync</dt><dd className="font-semibold">{syncs[i.id]}</dd>
              </dl>
              {i.id === "portales" && <p className="mt-3 rounded-md bg-accent p-2 text-xs">Los portales de las entidades no exponen API; la carga se hace por archivo o por agente.</p>}
              <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
                <Button variant="ghost" onClick={() => sync(i)} disabled={cargando === i.id || !isAdmin(session)} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-wine disabled:opacity-60">
                  <RefreshCw className={`h-4 w-4 ${cargando === i.id ? "animate-spin" : ""}`} /> Sincronizar ahora
                </Button>
                <Button variant="ghost" onClick={() => setMapeo(i)} className="text-sm font-semibold text-primary underline-offset-2 hover:underline">Ver mapeo de campos</Button>
                {i.estado !== "Conectado" && <EtiquetaSimulado />}
              </div>
            </div>
          );
        })}
      </div>

      {isAdmin(session) && <div className="mt-8 border-y py-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="section-title">Importar licitaciones por archivo CSV</h2>
          <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">Funciona</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Columnas: <code>entidad, proceso, valor, vence, fuente, responsable</code>. La entidad debe ser un cliente existente (nombre o NIT), el valor en millones de COP y la fecha como AAAA-MM-DD. Cada fila crea una oportunidad en la etapa Identificar.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="outline" asChild><Link to="/datos">Cargar Excel</Link></Button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => subir(e.target.files?.[0])} aria-label="Archivo CSV de licitaciones" />
          <Button variant="ghost" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 font-semibold text-primary-foreground hover:bg-wine">
            <Upload className="h-4 w-4" /> Importar desde portales (CSV)
          </Button>
          <Button variant="ghost" onClick={descargarEjemplo} className="inline-flex items-center gap-2 rounded-md border px-4 py-2.5 font-semibold hover:bg-accent">
            <Download className="h-4 w-4" /> Descargar plantilla
          </Button>
        </div>
        {resultado && (
          <div className="mt-4 text-sm">
            <p className="font-semibold">{resultado.creadas} oportunidades creadas. {resultado.creadas > 0 && <Link to="/" className="text-primary underline">Ver en el tablero</Link>}</p>
            {resultado.errores.length > 0 && <ul className="mt-1 list-disc pl-5 text-destructive">{resultado.errores.map((e) => <li key={e}>{e}</li>)}</ul>}
          </div>
        )}
      </div>}

      <div className="mt-8 rounded-xl border bg-card p-6">
        <h2 className="section-title mb-4">Plan de implementación</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {[
            { f: "Fase 1", t: "Uso interno", d: ["Carga de licitaciones por archivo CSV / Excel", "Cuentas propias de la aplicación por usuario y rol", "Registro de interacciones y PQR; encuestas desde Forms"] },
            { f: "Fase 2", t: "Webhooks y API", d: ["Webhook desde ISSA para PQR e incidentes (POST /pqr)", "Microsoft Forms vía Power Automate (POST /encuestas)", "Publicación de la API con llave por sistema"] },
            { f: "Fase 3", t: "Siigo, SharePoint y SSO", d: ["Costos, utilidad y facturación desde Siigo", "Documentos y Lists de SharePoint mediante Microsoft Graph", "Inicio de sesión único con la cuenta Microsoft de la empresa"] },
          ].map((p, n) => (
            <li key={p.f} className="rounded-lg border-l-4 border-primary bg-accent/40 p-4">
              <p className="text-xs font-bold uppercase tracking-normal text-primary">{p.f}{n === 0 ? " · en curso" : ""}</p>
              <p className="font-display text-lg font-bold">{p.t}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{p.d.map((x) => <li key={x}>{x}</li>)}</ul>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-muted-foreground">Ver los endpoints en la <Link to="/api" className="font-semibold text-primary underline">documentación de la API</Link>.</p>
      </div>

      {mapeo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={() => setMapeo(null)}>
          <div role="dialog" aria-label={`Mapeo de campos ${mapeo.nombre}`} className="w-full max-w-lg rounded-xl bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-primary">Mapeo de campos · {mapeo.nombre}</h3>
              <Button variant="ghost" onClick={() => setMapeo(null)} aria-label="Cerrar"><X className="h-5 w-5" /></Button>
            </div>
            <table className="mt-4 w-full text-sm">
              <thead><tr className="border-b text-left text-muted-foreground"><th className="py-2">Campo en {mapeo.nombre}</th><th>Campo en TCI</th></tr></thead>
              <tbody>{mapeo.mapeo.map(([a, b]) => <tr key={a} className="border-b last:border-0"><td className="py-2 font-mono">{a}</td><td className="font-mono">{b}</td></tr>)}</tbody>
            </table>
            <div className="mt-3"><EtiquetaSimulado /></div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
