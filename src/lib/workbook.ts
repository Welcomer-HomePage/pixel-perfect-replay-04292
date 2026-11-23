import * as XLSX from "xlsx";
import headers from "./workbook-headers.json";
import { deriveDb, emptyDb, demoUsuarios, ROLES, AREAS, type Db, type Cliente, type Contrato, type Oportunidad, type Rol, type Usuario } from "./data";

export const norm = (v: unknown) => String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
export const clean = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim();
export const username = (nombre: string) => norm(nombre).split(/\s+/)[0] ?? "";
export const maskIdentification = (value?: string) => value ? `••••${value.slice(-4)}` : "—";
export type Mode = "replace" | "merge";
export type Issue = { hoja: string; fila: number; columna: string; problema: string };
export type Grid = { name: string; kind: string; headerRow: number; cells: (XLSX.CellObject | null)[][]; mapping: Record<string, number> };
export type Review = { data: Db; issues: Issue[]; summary: { hoja: string; leidas: number; validas: number; errores: number }[]; grids: Grid[]; experience: boolean };
type Row = { sheet: string; kind: string; number: number; values: Record<string, string | number>; id: string; errors: Issue[] };
const required: Record<string, string[]> = {
 Clientes: ["id_cliente", "nombre", "tipo_cliente"], Oportunidades: ["id_oportunidad", "id_cliente", "proceso", "valor_mcop", "etapa", "fecha_cierre"],
 Tareas: ["id_oportunidad", "tarea", "area", "responsable", "fecha_limite", "estado"], Aprobaciones: ["id_oportunidad", "tipo", "aprobador_rol", "estado"],
 Proyectos: ["id_proyecto", "id_cliente", "nombre", "estado"], Equipo: ["id_proyecto", "nombre", "cargo"], Interacciones: ["id_cliente", "tipo", "fecha", "responsable", "descripcion"],
 PQR: ["id_caso", "id_cliente", "asunto", "estado", "fecha_radicacion", "ans_horas"], Encuestas: ["id_cliente", "fecha", "nota"], Usuarios: ["nombre", "cargo", "rol_app"], Aliados: ["nombre", "experiencia"],
 CONSOLIDADO: ["NO. RUP", "ESTADO", "ABREVIACIÓN", "NO. CONTRATO", "CLIENTE", "NIT", "OBJETO", "ACTIVIDADES", "PORCENTAJE DE PARTICIPACIÓN", "FECHA INICIO", "FECHA TERMINACION", "VALOR CON IVA", "VALOR EN SMMLV", "DURACIÓN EN MESES", "CODIGOS DE CLASIFICACION"],
};
const idColumn: Record<string, string> = { Clientes: "id_cliente", Oportunidades: "id_oportunidad", Proyectos: "id_proyecto", PQR: "id_caso", CONSOLIDADO: "NO. RUP" };
const numeric = new Set(["valor_mcop", "costo_total_historico_mcop", "utilidad_historica_pct", "proyectos_historicos", "costo_mcop", "utilidad_pct", "porcentaje_participacion", "valor_contrato_cop", "valor_smmlv", "duracion", "anios_experiencia", "ans_horas", "nota", "proyectos_conjuntos", ...["NO. RUP", "PORCENTAJE DE PARTICIPACIÓN", "VALOR CON IVA", "VALOR EN SMMLV", "DURACIÓN EN MESES"].map(norm)]);
const enumFields: Record<string, Record<string, readonly string[]>> = {
 Clientes: { tipo_cliente: ["Financiero", "Público", "Mixto", "Privado"], estado: ["Activo", "En seguimiento", "Inactivo"] },
 Oportunidades: { etapa: ["Identificada", "En evaluación", "En preparación", "Observaciones", "Propuesta", "Presentada", "Ganada", "Perdida"], fuente: ["SECOP II", "Portal propio", "Venta directa", "Otro"] },
 Tareas: { area: AREAS, estado: ["Pendiente", "En curso", "Listo"] }, Aprobaciones: { tipo: ["Técnica", "Presupuesto"], aprobador_rol: ["Gerente de área", "Gerencia Administrativa"], estado: ["Pendiente", "Aprobada", "Rechazada"] },
 Proyectos: { estado: ["En ejecución", "En cierre", "Cerrado"] }, Interacciones: { tipo: ["Llamada", "Reunión", "Correo", "Otro"], requiere_seguimiento: ["Sí", "No"] },
 PQR: { estado: ["Abierta", "En gestión", "Cerrada"], fuente: ["ISSA", "SharePoint", "Otro"], tipo_identificacion: ["NIT", "CC", "CE", "Pasaporte", "Otro"] },
 Usuarios: { rol_app: ROLES }, Aliados: { tipo_cliente_afin: ["Financiero", "Público", "Mixto", "Privado", "Todos"] }, CONSOLIDADO: { estado: ["Ejecutado", "En Ejecución"] },
};
function dateValue(cell: XLSX.CellObject | null | undefined): string {
 if (!cell || !clean(cell.v) || norm(cell.v) === "n/a") return "";
 if (cell.v instanceof Date) return cell.v.toISOString().slice(0, 10);
 if (typeof cell.v === "number") { const d = XLSX.SSF.parse_date_code(cell.v); return d ? `${d.y}-${String(d.m).padStart(2,"0")}-${String(d.d).padStart(2,"0")}` : ""; }
 const value = clean(cell.v);
 if (!/^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/.test(value)) return "";
 const d = new Date(value.replace(" ", "T"));
 return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === value.slice(0,10) ? value : "";
}
const isDate = (key: string) => key.startsWith("fecha") || key === "ultimo_contacto";
export function readWorkbook(buffer: ArrayBuffer): Grid[] {
 const wb = XLSX.read(buffer, { type: "array", cellDates: true });
 const grids: Grid[] = [];
 for (const name of wb.SheetNames) {
  const kind = norm(name) === "consolidado" ? "CONSOLIDADO" : Object.keys(headers).find((k) => norm(name).startsWith(norm(k)));
  if (!kind) continue;
  const sheet = wb.Sheets[name]; if (!sheet?.["!ref"]) continue;
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  if (range.e.r > 50000 || range.e.c > 300) throw new Error(`Hoja ${name}: supera el límite de 50.000 filas o 300 columnas.`);
  let hr = range.s.r;
  if (kind === "CONSOLIDADO") { hr = -1; for (let r = 0; r <= Math.min(range.e.r, 30); r++) for (let c = 0; c <= range.e.c; c++) if (norm(sheet[XLSX.utils.encode_cell({r,c})]?.v) === "no. rup") hr = r; if (hr < 0) throw new Error("CONSOLIDADO: no se encontró NO. RUP."); }
  const cells: Grid["cells"] = [];
  for (let r = hr; r <= range.e.r; r++) cells.push(Array.from({ length: range.e.c + 1 }, (_, c) => sheet[XLSX.utils.encode_cell({r,c})] ?? null));
  const desired = kind === "CONSOLIDADO" ? required[kind] ?? [] : [...((headers as Record<string,string[]>)[kind] ?? []), ...(({Proyectos:["duracion"],Encuestas:["id_respuesta","canal"],Equipo:["id_equipo"],Interacciones:["id_interaccion"],Tareas:["id_tarea"],Aprobaciones:["id_aprobacion"]} as Record<string,string[]>)[kind]??[])];
  const mapping: Record<string, number> = {};
  for (const key of desired) mapping[norm(key)] = cells[0]?.findIndex((cell) => norm(cell?.v) === norm(key)) ?? -1;
  grids.push({ name, kind, headerRow: hr + 1, cells, mapping });
 }
 if (!grids.length) throw new Error("No se encontraron hojas de la plantilla ni CONSOLIDADO.");
 return grids;
}
const txt = (r: Row, key: string) => clean(r.values[norm(key)]);
const num = (r: Row, key: string) => Number(r.values[norm(key)] || 0);
const hash = (value: string) => { let n=2166136261; for (const c of value) n=Math.imul(n ^ c.charCodeAt(0),16777619); return (n>>>0).toString(36); };
export const serviceNames: Record<string,string> = { FS: "Fábrica de Software", AAL: "Administración de Activos Leasing", AADP: "Administración de Activos dados en Dación de Pago", SA: "Servicios Administrativos", AAR: "Administración de Activos Restituidos", AP: "Automatización de Procesos", SN: "Soporte Nube", FD: "Fábrica de Datos", SAM: "Mantenimiento" };
export function inferClientType(name: string): Cliente["tipo"] {
 const n = norm(name);
 if (/banco|banca|bbva|fondo|financ|porvenir|leasing|fiducia|dann regional|findescol/.test(n)) return "Financiero";
 if (/minister|instituto|alcald|gobern|superintend|unidad|departamento|agencia|nacion|distrit|municip|estado|ecopetrol|sena|idu|fiscal|policia|ejercito/.test(n)) return "Público";
 return "Privado";
}
function baseClient(id: string, nombre: string, nit: string, tipo: Cliente["tipo"]): Cliente {
 return { id, nombre, nit, tipo, estado: "Inactivo", responsable: "", lider: "", supervisor: "", ultimoContacto: "", costo: "", utilidad: "", historicos: 0, proyectos: [], equipo: [], lineas: [] };
}
export function reviewWorkbook(grids: Grid[], mode: Mode, existing: Db, filename: string): Review {
 const rows: Row[] = []; const structural: Issue[] = [];
 for (const grid of grids) {
  for (const key of required[grid.kind] ?? []) if ((grid.mapping[norm(key)] ?? -1) < 0) structural.push({ hoja: grid.name, fila: grid.headerRow, columna: key, problema: "Falta columna obligatoria; revise el mapeo." });
  const seen = new Set<string>();
  grid.cells.slice(1).forEach((cells, index) => {
   if (cells.every((c) => !clean(c?.v))) return;
   if (grid.kind === "CONSOLIDADO" && !clean(cells[grid.mapping["estado"] ?? -1]?.v)) return;
   const r: Row = { sheet: grid.name, kind: grid.kind, number: grid.headerRow + index + 1, values: {}, id: "", errors: [] };
   const error = (columna: string, problema: string) => r.errors.push({ hoja: grid.name, fila: r.number, columna, problema });
   for (const [key, col] of Object.entries(grid.mapping)) {
    const cell = cells[col]; let value: string | number = "";
    if (numeric.has(key)) {
     value = cell?.v === undefined || clean(cell.v) === "" || norm(cell.v) === "n/a" || (grid.kind === "CONSOLIDADO" && key === "valor en smmlv" && norm(cell.v) === "pendiente rup") ? "" : typeof cell.v === "number" ? cell.v : Number(clean(cell.v).replace(/,/g,""));
     if (typeof value === "number" && (!Number.isFinite(value) || value < 0)) error(key, "Número no válido (debe ser no negativo).");
    } else if (isDate(key)) {
     value = dateValue(cell);
     if (clean(cell?.v) && !value && grid.kind !== "CONSOLIDADO") error(key, "Fecha inválida; use AAAA-MM-DD.");
    } else value = clean(cell?.w ?? cell?.v);
    r.values[key] = value;
    const allowed = enumFields[grid.kind]?.[key];
    if (value !== "" && allowed) { const canonical = allowed.find((v) => norm(v) === norm(value)); if (canonical) r.values[key] = canonical; else error(key, `Valor no permitido: ${allowed.join(" / ")}`); }
   }
   for (const key of required[grid.kind] ?? []) if (txt(r,key) === "" && !(grid.kind === "CONSOLIDADO" && ["no. contrato","fecha inicio","fecha terminacion","objeto","actividades","codigos de clasificacion","valor en smmlv"].includes(norm(key)))) error(key, "Dato obligatorio vacío.");
   if (grid.kind === "Proyectos" && (num(r,"porcentaje_participacion") > 1)) error("porcentaje_participacion", "Participación entre 0 y 1.");
   if (grid.kind === "Encuestas" && (num(r,"nota") < 1 || num(r,"nota") > 5)) error("nota", "La nota debe estar entre 1 y 5.");
   if (grid.kind === "Usuarios" && ["tomas"].includes(username(txt(r,"nombre")))) error("nombre", "Usuario reservado para el Administrador.");
   const extraId=({Tareas:"id_tarea",Aprobaciones:"id_aprobacion",Equipo:"id_equipo",Interacciones:"id_interaccion",Encuestas:"id_respuesta"} as Record<string,string>)[grid.kind];
   const idKey = idColumn[grid.kind] ?? (extraId && txt(r,extraId) ? extraId : undefined);
   r.id = idKey ? txt(r,idKey) : `${grid.kind}-${hash(grid.kind === "Usuarios" ? username(txt(r,"nombre")) : JSON.stringify(grid.kind==="Tareas"?{op:txt(r,"id_oportunidad"),tarea:txt(r,"tarea")}:grid.kind==="Aprobaciones"?{op:txt(r,"id_oportunidad"),tipo:txt(r,"tipo")}:grid.kind==="Equipo"?{proyecto:txt(r,"id_proyecto"),nombre:txt(r,"nombre")}:r.values))}`;
   if (seen.has(r.id)) error(idKey ?? "registro", "ID o registro duplicado en el archivo."); seen.add(r.id);
   rows.push(r);
  });
 }
 const data: Db = mode === "merge" ? structuredClone(existing) : emptyDb();
 const experience = grids.some((g) => g.kind === "CONSOLIDADO");
 // Reject dangling references, including references to a row rejected in this file.
 for (let pass=0; pass<4; pass++) {
  const ids = (kind: string, base: {id:string}[]) => new Set([...base.map((r) => r.id), ...rows.filter((r) => r.kind === kind && !r.errors.length && !structural.some((e)=>e.hoja===r.sheet)).map((r) => r.id)]);
  const clientIds = ids("Clientes", data.clientes), opIds = ids("Oportunidades", data.oportunidades), projectIds = ids("Proyectos", data.proyectos);
  for (const r of rows.filter((r) => !r.errors.length && r.kind !== "CONSOLIDADO")) {
   for (const [key, set] of [["id_cliente",clientIds],["id_oportunidad",opIds],["id_proyecto",projectIds]] as const) {
    if (idColumn[r.kind] === key) continue;
    const id = txt(r,key); if (id && !set.has(id)) r.errors.push({ hoja:r.sheet,fila:r.number,columna:key,problema:`No existe ${id} en los datos válidos del modo seleccionado.` });
   }
  }
 }
 const valid = rows.filter((r) => !r.errors.length && !structural.some((e) => e.hoja === r.sheet));
 const upsert = <T extends {id:string}>(items: T[], value: T) => { const index=items.findIndex((p) => p.id===value.id); if(index<0) items.push(value); else items[index]=value; };
 for (const r of valid.filter((r) => r.kind === "CONSOLIDADO")) {
  const nit = txt(r,"NIT").replace(/\s/g,"");
  let client = data.clientes.find((c) => c.nit.replace(/\s/g,"") === nit);
  if (!client) { let i=data.clientes.length+1; while(data.clientes.some((c)=>c.id===`CLI-${String(i).padStart(3,"0")}`)) i++; client=baseClient(`CLI-${String(i).padStart(3,"0")}`,txt(r,"CLIENTE"),nit,inferClientType(txt(r,"CLIENTE"))); data.clientes.push(client); }
  const rawContract = r.values["no. contrato"];
  const grid = grids.find((g) => g.name===r.sheet); const original = grid?.cells[r.number - (grid?.headerRow ?? 0)]?.[grid.mapping["no. contrato"] ?? -1]?.v;
  const line = txt(r,"ABREVIACIÓN").split(/\s*-\s*/).map((x)=>serviceNames[x]??x).join("; ");
  const state = txt(r,"ESTADO") === "En Ejecución" ? "En ejecución" : "Cerrado";
  if(state === "En ejecución") client.estado="Activo";
  upsert(data.proyectos,{id:`P-${String(num(r,"NO. RUP")).padStart(3,"0")}`,clienteId:client.id,oportunidadId:"",nombre:`${line} – ${client.nombre}`,estado:state,lider:"",supervisor:"",costo_mcop:null,utilidad_pct:null,fecha_inicio:txt(r,"FECHA INICIO"),fecha_fin:txt(r,"FECHA TERMINACION"),no_contrato:norm(rawContract)==="n/a"?"":String(original??rawContract??"").split(/\r?\n/).map(clean).filter(Boolean).join(" / "),linea_servicio:line,objeto:txt(r,"OBJETO"),actividades:txt(r,"ACTIVIDADES"),porcentaje_participacion:num(r,"PORCENTAJE DE PARTICIPACIÓN"),valor_contrato_cop:num(r,"VALOR CON IVA"),valor_smmlv:txt(r,"VALOR EN SMMLV")?num(r,"VALOR EN SMMLV"):null,duracion:num(r,"DURACIÓN EN MESES"),codigos_unspsc:txt(r,"CODIGOS DE CLASIFICACION").split(/[;\s,]+/).filter(Boolean).join(";")});
 }
 for (const r of valid.filter((r)=>r.kind==="Clientes")) upsert(data.clientes,{...baseClient(r.id,txt(r,"nombre"),txt(r,"nit"),txt(r,"tipo_cliente") as Cliente["tipo"]),estado:(txt(r,"estado")||"Inactivo") as Cliente["estado"],responsable:txt(r,"responsable_comercial"),lider:txt(r,"lider_proyecto"),supervisor:txt(r,"supervisor"),ultimoContacto:txt(r,"ultimo_contacto"),costo:txt(r,"costo_total_historico_mcop")?`$${num(r,"costo_total_historico_mcop").toLocaleString("es-CO")} M`:"",utilidad:txt(r,"utilidad_historica_pct")?`${num(r,"utilidad_historica_pct")}%`:""});
 for (const r of valid.filter((r)=>r.kind==="Oportunidades")) { const old=data.oportunidades.find((o)=>o.id===r.id); upsert(data.oportunidades,{id:r.id,clienteId:txt(r,"id_cliente"),proceso:txt(r,"proceso"),valor:num(r,"valor_mcop"),estado:txt(r,"etapa") as Oportunidad["estado"],vence:txt(r,"fecha_cierre"),fuente:(txt(r,"fuente")||"Otro") as Oportunidad["fuente"],responsable:txt(r,"responsable"),observaciones:txt(r,"observaciones"),pliegos:old?.pliegos??[],aliados:[],tareas:old?.tareas??[],aprobaciones:old?.aprobaciones??[],fases:old?.fases??[],historial:old?.historial??[]}); }
 for (const r of valid.filter((r)=>r.kind==="Proyectos")) upsert(data.proyectos,{id:r.id,clienteId:txt(r,"id_cliente"),oportunidadId:txt(r,"id_oportunidad"),nombre:txt(r,"nombre"),estado:txt(r,"estado") as Contrato["estado"],lider:txt(r,"lider_proyecto"),supervisor:txt(r,"supervisor"),costo_mcop:txt(r,"costo_mcop")?num(r,"costo_mcop"):null,utilidad_pct:txt(r,"utilidad_pct")?num(r,"utilidad_pct"):null,fecha_inicio:txt(r,"fecha_inicio"),fecha_fin:txt(r,"fecha_fin"),no_contrato:txt(r,"no_contrato"),linea_servicio:txt(r,"linea_servicio"),objeto:txt(r,"objeto"),porcentaje_participacion:num(r,"porcentaje_participacion"),valor_contrato_cop:num(r,"valor_contrato_cop"),valor_smmlv:txt(r,"valor_smmlv")?num(r,"valor_smmlv"):null,duracion:num(r,"duracion"),codigos_unspsc:txt(r,"codigos_unspsc"),actividades:txt(r,"actividades")});
 for (const r of valid) {
  const opportunity=data.oportunidades.find((o)=>o.id===txt(r,"id_oportunidad"));
  if(r.kind==="Tareas" && opportunity) upsert(opportunity.tareas,{id:r.id,tarea:txt(r,"tarea"),area:txt(r,"area"),responsable:txt(r,"responsable"),limite:txt(r,"fecha_limite"),estado:txt(r,"estado") as "Pendiente"|"En curso"|"Listo"});
  if(r.kind==="Aprobaciones" && opportunity) upsert(opportunity.aprobaciones,{id:r.id,tipo:txt(r,"tipo")==="Presupuesto"?"Aprobación de presupuesto":"Aprobación técnica",estado:txt(r,"estado") as "Pendiente"|"Aprobada"|"Rechazada",solicitante:opportunity.responsable,aprobadorRol:txt(r,"aprobador_rol") as Rol,por:txt(r,"aprobado_por"),fecha:txt(r,"fecha"),comentario:txt(r,"comentario")});
  if(r.kind==="Equipo") upsert(data.equipo,{id:r.id,proyectoId:txt(r,"id_proyecto"),nombre:txt(r,"nombre"),perfil:txt(r,"cargo"),experiencia:num(r,"anios_experiencia")});
  if(r.kind==="Interacciones") { upsert(data.interacciones,{id:r.id,clienteId:txt(r,"id_cliente"),oportunidadId:txt(r,"id_oportunidad"),tipo:txt(r,"tipo"),fecha:txt(r,"fecha"),responsable:txt(r,"responsable"),participantes:txt(r,"participantes"),descripcion:txt(r,"descripcion")}); if(txt(r,"requiere_seguimiento")==="Sí") upsert(data.pendientes,{id:`SEG-${r.id}`,clienteId:txt(r,"id_cliente"),oportunidadId:txt(r,"id_oportunidad"),fecha:txt(r,"fecha_proxima_accion"),texto:txt(r,"proxima_accion")}); }
  if(r.kind==="PQR") { const nitClient=txt(r,"tipo_identificacion")==="NIT"?data.clientes.find((c)=>c.nit.replace(/\D/g,"")===txt(r,"numero_identificacion").replace(/\D/g,"")):undefined; upsert(data.pqr,{id:r.id,clienteId:nitClient?.id??txt(r,"id_cliente"),asunto:txt(r,"asunto"),estado:txt(r,"estado") as "Abierta"|"En gestión"|"Cerrada",ans:`${num(r,"ans_horas")} h`,ans_horas:num(r,"ans_horas"),fecha:txt(r,"fecha_radicacion"),fuente:txt(r,"fuente")||"ISSA",tipo_identificacion:(txt(r,"tipo_identificacion")||"Otro") as "NIT"|"CC"|"CE"|"Pasaporte"|"Otro",numero_identificacion:txt(r,"numero_identificacion")}); }
  if(r.kind==="Encuestas") upsert(data.encuestas,{id:r.id,clienteId:txt(r,"id_cliente"),proyectoId:txt(r,"id_proyecto"),fecha:txt(r,"fecha"),nota:num(r,"nota"),comentario:txt(r,"comentario"),canal:"Forms"});
  if(r.kind==="Usuarios") upsert(data.usuarios,{id:r.id,nombre:txt(r,"nombre"),cargo:txt(r,"cargo"),rol:txt(r,"rol_app") as Usuario["rol"],area:txt(r,"area")});
  if(r.kind==="Aliados") upsert(data.aliados,{id:r.id,nombre:txt(r,"nombre"),experiencia:txt(r,"experiencia"),tipo_cliente_afin:txt(r,"tipo_cliente_afin"),proyectos_conjuntos:num(r,"proyectos_conjuntos")});
 }
 if(!data.usuarios.length) data.usuarios=demoUsuarios();
 for(const o of data.oportunidades) { const p=data.proyectos.find((p)=>p.oportunidadId===o.id); if(p) o.proyecto={lider:p.lider,supervisor:p.supervisor,costo:p.costo_mcop===null?"—":`$${p.costo_mcop} M`,utilidad:p.utilidad_pct===null?"—":`${p.utilidad_pct}%`,avance:0}; }
 data.origen={archivo:filename,fecha:new Date().toISOString(),experiencia:experience || (mode==="merge" && existing.origen.experiencia)};
 return {data:deriveDb(data),issues:[...structural,...rows.flatMap((r)=>r.errors)],summary:grids.map((g)=>({hoja:g.name,leidas:rows.filter((r)=>r.sheet===g.name).length,validas:valid.filter((r)=>r.sheet===g.name).length,errores:rows.filter((r)=>r.sheet===g.name && (r.errors.length || structural.some((e)=>e.hoja===g.name))).length})),grids,experience};
}
export function exportRows(d: Db): Record<string, Record<string,unknown>[]> {
 return {
 Clientes:d.clientes.map((c)=>({id_cliente:c.id,nombre:c.nombre,tipo_cliente:c.tipo,nit:c.nit,estado:c.estado,responsable_comercial:c.responsable,lider_proyecto:c.lider,supervisor:c.supervisor,ultimo_contacto:c.ultimoContacto,proyectos_historicos:c.historicos})),
 Oportunidades:d.oportunidades.map((o)=>({id_oportunidad:o.id,id_cliente:o.clienteId,proceso:o.proceso,valor_mcop:o.valor,etapa:o.estado,fecha_cierre:o.vence,fuente:o.fuente,responsable:o.responsable,observaciones:o.observaciones??""})),
 Proyectos:d.proyectos.map(({id,clienteId,oportunidadId,lider,supervisor,costo_mcop,utilidad_pct,...p})=>({id_proyecto:id,id_cliente:clienteId,id_oportunidad:oportunidadId,lider_proyecto:lider,supervisor,costo_mcop,utilidad_pct,...p})),
 Tareas:d.oportunidades.flatMap((o)=>o.tareas.map((t)=>({id_tarea:t.id,id_oportunidad:o.id,tarea:t.tarea,area:t.area,responsable:t.responsable,fecha_limite:t.limite,estado:t.estado}))),
 Aprobaciones:d.oportunidades.flatMap((o)=>o.aprobaciones.map((a)=>({id_aprobacion:a.id,id_oportunidad:o.id,tipo:a.tipo==="Aprobación técnica"?"Técnica":"Presupuesto",aprobador_rol:a.aprobadorRol??(a.tipo==="Aprobación técnica"?"Gerente de área":"Gerencia Administrativa"),estado:a.estado,aprobado_por:a.por??"",fecha:a.fecha??"",comentario:a.comentario??""}))),
 Equipo:d.equipo.map((e)=>({id_equipo:e.id,id_proyecto:e.proyectoId,nombre:e.nombre,cargo:e.perfil,anios_experiencia:e.experiencia})),
 Interacciones:d.interacciones.map((i)=>({id_interaccion:i.id,id_cliente:i.clienteId,id_oportunidad:i.oportunidadId??"",tipo:i.tipo,fecha:i.fecha,responsable:i.responsable,participantes:i.participantes,descripcion:i.descripcion})),
 PQR:d.pqr.map((p)=>({id_caso:p.id,id_cliente:p.clienteId,asunto:p.asunto,estado:p.estado,fecha_radicacion:p.fecha??"",ans_horas:p.ans_horas??0,fuente:p.fuente,tipo_identificacion:p.tipo_identificacion??""})),
 Encuestas:d.encuestas.map((e)=>({id_respuesta:e.id,canal:e.canal,id_cliente:e.clienteId,id_proyecto:e.proyectoId,fecha:e.fecha,nota:e.nota,comentario:e.comentario})),
 Usuarios:d.usuarios.map((u)=>({nombre:u.nombre,cargo:u.cargo,rol_app:u.rol,area:u.area})), Aliados:d.aliados.map(({id,...a})=>a),
 };
}
export function downloadWorkbook(sheets: Record<string, Record<string,unknown>[]>, filename: string, template=false) {
 const wb=XLSX.utils.book_new();
 for (const [name,rows] of Object.entries(sheets)) {
  const columns = template ? (headers as Record<string,string[]>)[name] ?? Object.keys(rows[0]??{}) : [...new Set([...((headers as Record<string,string[]>)[name]??[]),...rows.flatMap(Object.keys)])].filter((k)=>k!=="numero_identificacion");
  const safeRows=rows.map((row)=>Object.fromEntries(Object.entries(row).filter(([k])=>k!=="numero_identificacion").map(([k,v])=>[k,typeof v==="string"&&/^[=+@]/.test(v)?`'${v}`:v])));
  const ws=XLSX.utils.json_to_sheet(safeRows,{header:columns});
  ws["!cols"]=columns.map((c)=>({wch:Math.min(45,Math.max(16,c.length+2))}));
  XLSX.utils.book_append_sheet(wb,ws,name.slice(0,31));
 }
 XLSX.writeFile(wb,filename);
}