import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { emptyDb, type Db } from "@/lib/data";
import initial from "@/lib/initial-data.json";
import { exportRows, maskIdentification, readWorkbook, reviewWorkbook, username } from "@/lib/workbook";
import { allowedPath, login, logout, scopedDb, type Session } from "@/lib/auth";
import { executeDemoApi } from "@/lib/demo-api";
import { experienceTotals, filterExperience } from "@/lib/experience";
import { replaceDb } from "@/lib/data";
function workbook(sheets:Record<string,unknown[][]>){const w=XLSX.utils.book_new();for(const [name,rows] of Object.entries(sheets))XLSX.utils.book_append_sheet(w,XLSX.utils.aoa_to_sheet(rows),name);return readWorkbook(XLSX.write(w,{type:'array',bookType:'xlsx'}) as ArrayBuffer);}
const clientHeader=['id_cliente','nombre','tipo_cliente'];
const opHeader=['id_oportunidad','id_cliente','proceso','valor_mcop','etapa','fecha_cierre','responsable'];
const real=initial as Db;
describe('Excel TCI',()=>{
 it('carga exactamente 16 clientes del consolidado',()=>{expect(real.clientes).toHaveLength(16);expect(new Set(real.clientes.map((c)=>c.nit)).size).toBe(16);});
 it('carga los 36 contratos y deja vacío el tablero',()=>{expect(real.proyectos).toHaveLength(36);expect(real.oportunidades).toHaveLength(0);expect(real.proyectos.find((p)=>p.id==='P-001')?.valor_contrato_cop).toBe(283534000);});
 it('marca activo al cliente con contrato en ejecución',()=>{expect(real.clientes.find((c)=>c.nombre==='FONDO NACIONAL DEL AHORRO')?.estado).toBe('Activo');expect(real.clientes.find((c)=>c.nombre==='BBVA')?.estado).toBe('Inactivo');});
 it('normaliza tildes, nombres de hojas y conserva identificadores formateados',()=>{const w=XLSX.utils.book_new();const s=XLSX.utils.aoa_to_sheet([['ID_CLIENTE','NÓMBRE','TIPO_CLIENTE','nit'],['CLI-001','Banco prueba','Financiero',123]]);const cell=s['D2'];if(cell)cell.z='00000';XLSX.utils.book_append_sheet(w,s,'CLIENTES Real');const r=reviewWorkbook(readWorkbook(XLSX.write(w,{type:'array',bookType:'xlsx'}) as ArrayBuffer),'replace',emptyDb(),'test');expect(r.issues).toHaveLength(0);expect(r.data.clientes[0]?.nit).toBe('00123');});
 it('rechaza IDs duplicados',()=>{const r=reviewWorkbook(workbook({Clientes:[clientHeader,['C1','A','Privado'],['C1','B','Privado']]}),'replace',emptyDb(),'x');expect(r.summary[0]?.errores).toBe(1);expect(r.data.clientes).toHaveLength(1);});
 it('valida llaves foráneas en reemplazo',()=>{const r=reviewWorkbook(workbook({Oportunidades:[opHeader,['OP1','NoExiste','X',100,'Identificada','2026-12-01','Luisa']]}),'replace',real,'x');expect(r.data.oportunidades).toHaveLength(0);expect(r.issues.some((e)=>e.columna==='id_cliente')).toBe(true);});
 it('agrega oportunidades sin perder experiencia y actualiza por id',()=>{const grid=workbook({Oportunidades:[opHeader,['OP1','CLI-001','Proceso real',100,'Identificada','2026-12-01','Luisa']]});const first=reviewWorkbook(grid,'merge',real,'x');const second=reviewWorkbook(grid,'merge',first.data,'x');expect(second.data.proyectos).toHaveLength(36);expect(second.data.clientes).toHaveLength(16);expect(second.data.oportunidades).toHaveLength(1);expect(second.data.oportunidades[0]?.responsable).toBe('Luisa');});
 it('rechaza fechas inexistentes y enums inválidos',()=>{const r=reviewWorkbook(workbook({Clientes:[clientHeader,['C1','A','Incorrecto']],Oportunidades:[opHeader,['OP1','C1','X',100,'Identificada','2026-02-30','Luisa']]}),'replace',emptyDb(),'x');expect(r.issues.some((e)=>e.columna==='tipo_cliente')).toBe(true);expect(r.issues.some((e)=>e.columna==='fecha_cierre')).toBe(true);expect(r.data.oportunidades).toHaveLength(0);});
 it('nota Forms válida solo entre 1 y 5',()=>{const r=reviewWorkbook(workbook({Clientes:[clientHeader,['C1','A','Privado']],Encuestas:[['id_cliente','fecha','nota'],['C1','2026-11-23',6],['C1','2026-11-23',5]]}),'replace',emptyDb(),'x');expect(r.data.encuestas).toHaveLength(1);expect(r.data.encuestas[0]?.nota).toBe(5);expect(r.summary.find((s)=>s.hoja==='Encuestas')?.errores).toBe(1);});
 it('mapea NIT de PQR al cliente, enmascara y excluye identificación del Excel',()=>{const d=structuredClone(real);const c=d.clientes[0];if(!c)throw new Error('fixture');const r=executeDemoApi(d,'POST','/pqr',{id:'P1',tipo_identificacion:'NIT',numero_identificacion:c.nit,asunto:'Prueba',estado:'Abierta',fecha:'2026-11-23',ans:'48h'},'tci_demo');expect(r.data.pqr[0]?.clienteId).toBe(c.id);expect(JSON.stringify(r.result)).not.toContain(c.nit);expect(exportRows(r.data)['PQR']?.[0]).not.toHaveProperty('numero_identificacion');expect(maskIdentification('123456789')).toBe('••••6789');});
 it('no admite el campo retirado en oportunidades',()=>{const c=real.clientes[0];if(!c)throw new Error('fixture');expect(()=>executeDemoApi(real,'POST','/oportunidades',{clienteId:c.id,proceso:'X',valor:1,vence:'2026-12-31',responsable:'Luisa',requisitos:'Dirigido'},'tci_demo')).toThrow();});
 it('Forms deduplica por id_respuesta',()=>{const payload={id_cliente:'CLI-001',nota:5,comentario:'Bien',fecha:'2026-11-23',canal:'Forms',id_respuesta:'F1'};const a=executeDemoApi(real,'POST','/encuestas',payload,'tci_demo');const b=executeDemoApi(a.data,'POST','/encuestas',payload,'tci_demo');expect(b.data.encuestas).toHaveLength(1);});
});
describe('Perfiles demo',()=>{
 const admin:Session={nombre:'Tomas',usuario:'tomas',rol:'Administrador',viewAs:'Administrador'};
 it('solo administrador puede cargar y borrar datos',()=>{expect(allowedPath(admin,'/datos')).toBe(true);expect(allowedPath({...admin,rol:'Líder Comercial',viewAs:'Líder Comercial'},'/datos')).toBe(false);expect(allowedPath(null,'/experiencia')).toBe(false);});
 it('Tomas ingresa con su clave y otros con clave inicial; sesión en sessionStorage',()=>{replaceDb(real);expect(login('Tomas','incorrecta')).toBe(false);expect(login('Tomas','123')).toBe(true);expect(JSON.parse(sessionStorage.getItem('tci-session')??'{}').rol).toBe('Administrador');logout();expect(sessionStorage.getItem('tci-session')).toBe(null);expect(login('luisa','tci2026')).toBe(true);logout();});
 it('usuario se deriva del nombre de pila sin tildes',()=>{expect(username('Ándrea Rojas')).toBe('andrea');});
 it('comercial solo ve cuentas propias',()=>{const d=structuredClone(real);const a=d.clientes[0],b=d.clientes[1];if(!a||!b)throw new Error('fixture');a.responsable='Luisa Pérez';b.responsable='Juan Martínez';const visible=scopedDb(d,{nombre:'Luisa Pérez',usuario:'luisa',rol:'Líder Comercial',viewAs:'Líder Comercial'});expect(visible.clientes.map((c)=>c.id)).toContain(a.id);expect(visible.clientes.map((c)=>c.id)).not.toContain(b.id);});
});
describe('Matriz de experiencia',()=>{
 const blank={linea:'',cliente:'',tipo:'',estado:'',desde:'',hasta:'',min:'',q:''};
 it('lista los 36 contratos sin filtros',()=>{expect(filterExperience(real.proyectos,real.clientes,blank)).toHaveLength(36);expect(experienceTotals(real.proyectos).contratos).toBe(36);});
 it('valor mínimo SMMLV no incluye pendientes',()=>{const list=filterExperience(real.proyectos,real.clientes,{...blank,min:'500'});expect(list.length).toBeGreaterThan(0);expect(list.every((p)=>p.valor_smmlv!==null&&p.valor_smmlv>=500)).toBe(true);expect(list.some((p)=>p.id==='P-001')).toBe(true);});
});