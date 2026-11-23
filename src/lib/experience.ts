import type { Cliente, Contrato } from "./data";
import { norm } from "./workbook";
export type ExperienceFilter={linea:string;cliente:string;tipo:string;estado:string;desde:string;hasta:string;min:string;q:string};
export function filterExperience(projects:Contrato[],clients:Cliente[],f:ExperienceFilter){return projects.filter((p)=>{
 const c=clients.find((c)=>c.id===p.clienteId);const year=Number(p.fecha_inicio.slice(0,4));
 return (!f.linea||p.linea_servicio.split('; ').includes(f.linea))&&(!f.cliente||p.clienteId===f.cliente)&&(!f.tipo||c?.tipo===f.tipo)&&(!f.estado||p.estado===f.estado)&&(!f.desde||year>=Number(f.desde))&&(!f.hasta||year<=Number(f.hasta))&&(!f.min||p.valor_smmlv!==null&&p.valor_smmlv>=Number(f.min))&&(!f.q||norm(p.objeto+' '+p.codigos_unspsc).includes(norm(f.q)));
 });}
export function experienceTotals(projects:Contrato[]){
 const intervals=projects.filter((p)=>p.fecha_inicio && p.fecha_fin).map((p)=>[Date.parse(p.fecha_inicio),Date.parse(p.fecha_fin)] as const).filter(([a,b])=>Number.isFinite(a)&&Number.isFinite(b)&&b>=a).sort((a,b)=>a[0]-b[0]);
 let days=0,end=0;for(const [a,b] of intervals){days+=Math.max(0,b-Math.max(a,end))/864e5;end=Math.max(end,b);}
 return {contratos:projects.length,clientes:new Set(projects.map((p)=>p.clienteId)).size,valor:projects.reduce((s,p)=>s+p.valor_contrato_cop,0),cerrados:projects.filter((p)=>p.estado==='Cerrado').reduce((s,p)=>s+p.valor_contrato_cop,0),smmlv:projects.reduce((s,p)=>s+(p.valor_smmlv??0),0),anios:days/365.25};
}