import { createFileRoute } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import { AppShell, Migas } from "@/components/AppShell";
import { EtiquetaSimulado } from "./integraciones";

export const Route = createFileRoute("/api")({
  head: () => ({
    meta: [
      { title: "API REST · TCI Gestión de Clientes" },
      { name: "description", content: "Documentación de los endpoints REST de TCI para oportunidades, clientes, PQR, encuestas, costos e importaciones." },
      { property: "og:title", content: "API REST · TCI" },
      { property: "og:description", content: "Endpoints, autenticación con llave de API y ejemplos JSON." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Api,
});

type Ep = { m: "GET" | "POST" | "PATCH"; ruta: string; desc: string; origen?: string; req?: unknown; res: unknown };

const EPS: Ep[] = [
  { m: "GET", ruta: "/oportunidades", desc: "Lista oportunidades. Filtros: ?etapa=, ?clienteId=, ?responsable=", res: { data: [{ id: "op-idu", clienteId: "idu", proceso: "Software misional", valor: 850, estado: "Identificada", responsable: "Luisa Pérez", vence: "2026-11-09", fuente: "Portal propio", requisitos: "Dirigido" }], total: 1 } },
  { m: "POST", ruta: "/oportunidades", desc: "Crea una oportunidad en la etapa Identificar.", req: { clienteId: "fna", proceso: "Mesa de ayuda", valor: 540, vence: "2026-12-01", fuente: "SECOP II", requisitos: "Estándar" }, res: { id: "op-8f21", estado: "Identificada", creada: "2026-11-09T12:30:00-05:00" } },
  { m: "PATCH", ruta: "/oportunidades/{id}/etapa", desc: "Avanza o cambia el estado. Falla con 409 si hay aprobaciones pendientes.", req: { estado: "En preparación", quien: "Luisa Pérez" }, res: { id: "op-fna-mesa", estado: "En preparación", historial: [{ fecha: "09/11/2026 12:31", quien: "Luisa Pérez", texto: "Pasó a En preparación" }] } },
  { m: "GET", ruta: "/clientes/{id}/360", desc: "Vista 360° completa del cliente.", res: { cliente: { id: "bancolombia", nombre: "Bancolombia", nit: "890.903.938", estado: "Activo", costo: "$480 M", utilidad: "+18%" }, oportunidades: 3, interacciones: 4, pqrAbiertas: 1, encuestaPromedio: 4.5 } },
  { m: "POST", ruta: "/pqr", origen: "Webhook desde ISSA", desc: "Crea o actualiza un caso. Se identifica por id del caso.", req: { id: "PQR-0150", nit: "899.999.081", asunto: "Error en módulo de reportes", estado: "Abierta", fecha: "2026-11-09T10:00:00-05:00", ans: "Vence en 24 h" }, res: { id: "PQR-0150", clienteId: "idu", accion: "creada" } },
  { m: "POST", ruta: "/encuestas", origen: "Desde Microsoft Forms (Power Automate)", desc: "Registra una encuesta de satisfacción.", req: { responseId: "f-77a1", nit: "890.903.938", oportunidadId: "op-banco-gan", nota: 4.6, comentario: "Buen acompañamiento" }, res: { id: "enc-101", clienteId: "bancolombia", registrada: true } },
  { m: "POST", ruta: "/proyectos/{id}/costos", origen: "Desde Siigo", desc: "Actualiza costo, utilidad y facturación del proyecto.", req: { centroCosto: "CC-ECO-22", costo: 720, utilidad: 0.22, facturado: 610, corte: "2026-10-31" }, res: { proyectoId: "op-eco-gan", actualizado: true } },
  { m: "POST", ruta: "/importaciones/licitaciones", desc: "Carga masiva desde archivo o agente. Cada fila crea una oportunidad en Identificar.", req: { origen: "agente-secop", filas: [{ entidad: "IDU", proceso: "Mantenimiento de software", valor: 420, vence: "2026-12-05", fuente: "SECOP II", requisitos: "Estándar" }] }, res: { creadas: 1, errores: [] } },
];

const color = { GET: "bg-success-soft text-success", POST: "bg-primary text-primary-foreground", PATCH: "bg-warning-soft text-warning-foreground" };

function Api() {
  return (
    <AppShell>
      <Migas items={[{ label: "Tablero", to: "/" }, { label: "API" }]} />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-wine">API REST</h1>
        <EtiquetaSimulado />
      </div>
      <p className="text-muted-foreground">Endpoints sobre el mismo modelo de datos de la aplicación. Base: <code>https://api.tci.com.co/v1</code>. Aún no están publicados: los datos viven en el navegador de cada usuario.</p>

      <div className="mt-6 flex gap-3 rounded-xl border bg-card p-5">
        <KeyRound className="h-6 w-6 shrink-0 text-primary" />
        <div className="text-sm">
          <p className="font-semibold">Autenticación con llave de API</p>
          <p className="text-muted-foreground">Cada sistema (ISSA, Forms, Siigo, agente de portales) tiene su propia llave. Se envía en el encabezado:</p>
          <pre className="mt-2 rounded-md bg-muted p-3 font-mono text-xs">x-api-key: tci_live_xxxxxxxxxxxxxxxx</pre>
          <p className="mt-2 text-muted-foreground">Respuestas: 401 sin llave o llave inválida, 422 datos inválidos, 409 conflicto de estado.</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {EPS.map((e) => (
          <section key={e.m + e.ruta} className="rounded-xl border bg-card p-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${color[e.m]}`}>{e.m}</span>
              <code className="font-mono font-semibold">{e.ruta}</code>
              {e.origen && <span className="text-xs font-semibold text-primary">{e.origen}</span>}
              <span className="ml-auto"><EtiquetaSimulado /></span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{e.desc}</p>
            <div className={`mt-3 grid gap-3 ${e.req ? "md:grid-cols-2" : ""}`}>
              {e.req !== undefined && <Json t="Solicitud" v={e.req} />}
              <Json t="Respuesta 200" v={e.res} />
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}

function Json({ t, v }: { t: string; v: unknown }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{t}</p>
      <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">{JSON.stringify(v, null, 2)}</pre>
    </div>
  );
}
