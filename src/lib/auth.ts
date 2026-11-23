import { useMemo, useSyncExternalStore } from "react";
import { getDb, refreshStore, setRol, useDb, type Db, type Rol } from "./data";
import { username } from "./workbook";

// Demo sin seguridad real; para producción usar Supabase Auth
export type Session = { nombre: string; usuario: string; rol: Rol | "Administrador"; viewAs: Rol | "Administrador" };
let session: Session | null = null;
const listeners=new Set<()=>void>();
const subscribe=(l:()=>void)=>{listeners.add(l);return()=>listeners.delete(l);};
export const useSession=()=>useSyncExternalStore(subscribe,()=>session,()=>null);
export const getSession=()=>session;
const notify=()=>{listeners.forEach((l)=>l());refreshStore();};
function persist() {
 if(session) { sessionStorage.setItem("tci-session",JSON.stringify(session)); setRol(session.viewAs); }
 else sessionStorage.removeItem("tci-session");
 notify();
}
export function restoreSession() {
 try { const raw=sessionStorage.getItem("tci-session"); if(raw) { const saved=JSON.parse(raw) as Session; if(saved.usuario==="tomas" && saved.rol==="Administrador" || getDb().usuarios.some((u)=>username(u.nombre)===saved.usuario && u.rol===saved.rol)) {session={...saved,viewAs:saved.rol==="Administrador"?saved.viewAs:saved.rol};setRol(session.viewAs);} } } catch {session=null;}
 notify();
}
export function login(usuario: string, clave: string): boolean {
 const u=username(usuario);
 if(u==="tomas" && clave==="123") session={nombre:"Tomas",usuario:u,rol:"Administrador",viewAs:"Administrador"};
 else { const found=getDb().usuarios.find((user)=>username(user.nombre)===u); if(!found || clave!=="tci2026") return false; session={nombre:found.nombre,usuario:u,rol:found.rol,viewAs:found.rol}; }
 persist();return true;
}
export function logout() { session=null;persist(); }
export function viewAs(rol: Rol | "Administrador") { if(session?.rol!=="Administrador") return; session={...session,viewAs:rol};persist(); }
export const isAdmin=(s:Session|null)=>s?.rol==="Administrador";
export function allowedPath(s:Session|null,path:string) { if(path==="/login") return true; if(!s)return false; if(path==="/datos")return isAdmin(s); if(s.viewAs==="Recursos Humanos")return path==="/mi-bandeja"; return true; }
export function scopedDb(d: Db, s: Session | null): Db {
 if(!s) return {...d,clientes:[],oportunidades:[],proyectos:[],equipo:[],encuestas:[],pqr:[],interacciones:[],pendientes:[],notificaciones:[],usuarios:[],aliados:[]};
 const role=s.viewAs;
 if(role==="Administrador")return d;
 const shadow=isAdmin(s), own=(name:string)=>shadow || username(name)===s.usuario;
 if(role==="Recursos Humanos")return {...d,clientes:[],oportunidades:[],proyectos:d.proyectos,encuestas:[],pqr:[],interacciones:[],pendientes:[],usuarios:[],aliados:[]};
 const opportunities=d.oportunidades.filter((o)=>role==="Líder Comercial"?own(o.responsable):role==="Líder de proyecto"?own(o.proyecto?.lider??"") || o.tareas.some((t)=>own(t.responsable)):o.aprobaciones.some((a)=>(a.aprobadorRol??(a.tipo==="Aprobación técnica"?"Gerente de área":"Gerencia Administrativa"))===role));
 const projects=d.proyectos.filter((p)=>role==="Líder de proyecto"?own(p.lider):role==="Líder Comercial"?own(d.clientes.find((c)=>c.id===p.clienteId)?.responsable??""):role==="Gerencia Administrativa");
 const clientIds=new Set([...opportunities.map((o)=>o.clienteId),...projects.map((p)=>p.clienteId),...d.clientes.filter((c)=>role==="Líder Comercial" && own(c.responsable)||role==="Líder de proyecto" && own(c.lider)).map((c)=>c.id)]);
 const clientes=d.clientes.filter((c)=>clientIds.has(c.id));
 const opIds=new Set(opportunities.map((o)=>o.id));
 return {...d,clientes,oportunidades:opportunities,proyectos:projects,equipo:d.equipo.filter((e)=>projects.some((p)=>p.id===e.proyectoId)),pqr:d.pqr.filter((p)=>clientIds.has(p.clienteId) && (role!=="Líder de proyecto" || own(p.responsable??d.clientes.find((c)=>c.id===p.clienteId)?.lider??""))),encuestas:d.encuestas.filter((e)=>clientIds.has(e.clienteId)),interacciones:d.interacciones.filter((i)=>clientIds.has(i.clienteId)),pendientes:d.pendientes.filter((p)=>clientIds.has(p.clienteId)),notificaciones:d.notificaciones.filter((n)=>n.rol===role&&opIds.has(n.oportunidadId)),usuarios:shadow?d.usuarios:d.usuarios.filter((u)=>username(u.nombre)===s.usuario),aliados:d.aliados};
}
export function useVisibleDb() { const d=useDb(),s=useSession();return useMemo(()=>scopedDb(d,s),[d,s]); }