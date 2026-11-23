import { z } from "zod";
import { type Db, type Oportunidad, type Pqr, deriveDb } from "./data";
import { maskIdentification } from "./workbook";
export type Method="GET"|"POST"|"PATCH";
export const opportunitySchema=z.object({id:z.string().optional(),clienteId:z.string().min(1),proceso:z.string().min(1),valor:z.number().nonnegative(),vence:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),fuente:z.enum(["SECOP II","Portal propio","Venta directa","Otro"]).default("Otro"),responsable:z.string().min(1),observaciones:z.string().optional()}).strict();
const states=["Identificada","En evaluación","En preparación","Observaciones","Propuesta","Presentada","Ganada","Perdida"] as const;
export function safePqr(p:Pqr){const {numero_identificacion,...rest}=p;return {...rest,identificacion_enmascarada:maskIdentification(numero_identificacion)};}
export function executeDemoApi(d:Db,method:Method,path:string,input:unknown,key:string){
 if(key!=="tci_demo")throw new Error("401 · Llave de simulación inválida.");
 const next=structuredClone(d);const url=new URL(path,"https://demo.tci.invalid");let result:unknown;
 const fail=(message:string):never=>{throw new Error(message);};
 const validClient=(id:string)=>d.clientes.some((c)=>c.id===id)||fail("422 · El cliente no existe.");
 const create=(value:unknown)=>{const parsed=opportunitySchema.parse(value);validClient(parsed.clienteId);const id=parsed.id??`OP-${crypto.randomUUID().slice(0,8)}`;if(next.oportunidades.some((o)=>o.id===id))fail("409 · Ya existe la oportunidad.");const {observaciones,...p}=parsed;const o:Oportunidad={...p,id,estado:"Identificada",pliegos:[],tareas:[],aprobaciones:[],aliados:[],fases:[],historial:[],...(observaciones?{observaciones}:{})};next.oportunidades.push(o);return o;};
 if(method==="GET"&&url.pathname==="/oportunidades"){let rows=d.oportunidades;for(const [key,value] of url.searchParams)if(["estado","etapa","clienteId","responsable"].includes(key))rows=rows.filter((o)=>String(o[key==="etapa"?"estado":key as "estado"|"clienteId"|"responsable"])===value);result={data:rows,total:rows.length};}
 else if(method==="GET"&&url.pathname==="/clientes")result={data:d.clientes,total:d.clientes.length};
 else if(method==="GET"&&/^\/clientes\/[^/]+\/360$/.test(url.pathname)){const id=url.pathname.split('/')[2]??"";validClient(id);result={cliente:d.clientes.find((c)=>c.id===id),proyectos:d.proyectos.filter((p)=>p.clienteId===id),oportunidades:d.oportunidades.filter((o)=>o.clienteId===id),pqr:d.pqr.filter((p)=>p.clienteId===id).map(safePqr),encuestas:d.encuestas.filter((e)=>e.clienteId===id)};}
 else if(method==="POST"&&url.pathname==="/oportunidades")result=create(input);
 else if(method==="PATCH"&&/^\/oportunidades\/[^/]+$/.test(url.pathname)){
  const p=z.object({responsable:z.string().min(1),estado:z.enum(states).optional(),observaciones:z.string().optional()}).strict().parse(input);const id=url.pathname.split('/')[2];const o=next.oportunidades.find((o)=>o.id===id);if(!o)fail("404 · No existe la oportunidad.");else{if(o.estado==="En preparación"&&p.estado&&p.estado!==o.estado&&o.aprobaciones.some((a)=>a.estado==="Pendiente"))fail("409 · Aprobaciones pendientes.");Object.assign(o,p);result=o;}
 }
 else if(method==="POST"&&url.pathname==="/pqr"){
  const p=z.object({id:z.string().min(1),id_cliente:z.string().optional(),tipo_identificacion:z.enum(["NIT","CC","CE","Pasaporte","Otro"]),numero_identificacion:z.string().min(1),asunto:z.string().min(1),estado:z.enum(["Abierta","En gestión","Cerrada"]),fecha:z.string().min(1),ans:z.string().min(1),responsable:z.string().optional()}).strict().parse(input);
  const client=p.tipo_identificacion==="NIT"?d.clientes.find((c)=>c.nit.replace(/\D/g,"")===p.numero_identificacion.replace(/\D/g,"")):d.clientes.find((c)=>c.id===p.id_cliente);
  if(!client)fail("422 · No se pudo relacionar la identificación con un cliente.");else{const row:Pqr={id:p.id,clienteId:client.id,tipo_identificacion:p.tipo_identificacion,numero_identificacion:p.numero_identificacion,asunto:p.asunto,estado:p.estado,fecha:p.fecha,ans:p.ans,fuente:"ISSA",...(p.responsable?{responsable:p.responsable}:{})};const i=next.pqr.findIndex((x)=>x.id===p.id);if(i<0)next.pqr.push(row);else next.pqr[i]=row;result=safePqr(row);}
 }
 else if(method==="POST"&&url.pathname==="/encuestas"){
  const p=z.object({id_cliente:z.string().optional(),nit:z.string().optional(),nota:z.number().min(1).max(5),comentario:z.string(),fecha:z.string().min(1),canal:z.literal("Forms"),id_respuesta:z.string().min(1)}).strict().parse(input);const client=d.clientes.find((c)=>c.id===p.id_cliente || p.nit&&c.nit.replace(/\D/g,"")===p.nit.replace(/\D/g,""));
  if(!client)fail("422 · Cliente no encontrado.");else{const exists=next.encuestas.find((e)=>e.id===p.id_respuesta);if(exists)result={id:exists.id,registrada:false,duplicada:true};else{next.encuestas.push({id:p.id_respuesta,clienteId:client.id,proyectoId:"",fecha:p.fecha,nota:p.nota,comentario:p.comentario,canal:"Forms"});result={id:p.id_respuesta,registrada:true};}}
 }
 else if(method==="POST"&&url.pathname==="/proyectos"){
  const p=z.object({id_proyecto:z.string().min(1),id_cliente:z.string().min(1),id_oportunidad:z.string().default(""),nombre:z.string().min(1),estado:z.enum(["En ejecución","En cierre","Cerrado"]),lider_proyecto:z.string().default(""),supervisor:z.string().default(""),costo_mcop:z.number().nonnegative().nullable().default(null),utilidad_pct:z.number().nullable().default(null),fecha_inicio:z.string().default(""),fecha_fin:z.string().default(""),no_contrato:z.string().default(""),linea_servicio:z.string().default(""),objeto:z.string().default(""),porcentaje_participacion:z.number().min(0).max(1).default(1),valor_contrato_cop:z.number().nonnegative().default(0),valor_smmlv:z.number().nonnegative().nullable().default(null),codigos_unspsc:z.string().default(""),actividades:z.string().default(""),duracion:z.number().nonnegative().default(0)}).strict().parse(input);validClient(p.id_cliente);if(p.id_oportunidad&&!d.oportunidades.some((o)=>o.id===p.id_oportunidad))fail("422 · Oportunidad no encontrada.");const {id_proyecto,id_cliente,id_oportunidad,lider_proyecto,...fields}=p;const row={...fields,id:id_proyecto,clienteId:id_cliente,oportunidadId:id_oportunidad,lider:lider_proyecto};const i=next.proyectos.findIndex((x)=>x.id===row.id);if(i<0)next.proyectos.push(row);else next.proyectos[i]=row;result=row;
 }
 else if(method==="POST"&&url.pathname==="/importaciones"){
  const p=z.object({origen:z.string(),filas:z.array(opportunitySchema)}).strict().parse(input);const added=p.filas.map(create);result={creadas:added.length,errores:[]};
 }else fail("404 · Operación no disponible en esta simulación.");
 return {data:deriveDb(next),result};
}