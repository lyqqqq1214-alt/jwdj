import api from "./api";
export interface TeachingAssistant { id:number; staffId:string; name:string; teacherId:number; status:"active"|"disabled"; createdAt:string; }
export interface TAPermissions { allowedClasses:number[]; canImport:boolean; canGrade:boolean; canViewProfile:boolean; }
type Raw = {id:number;username:string;name:string;status:string;permissions?:any[]};
const permissionCache: Record<string,TAPermissions> = {};
const normalize = (raw: Raw): TeachingAssistant => { const p=raw.permissions||[]; permissionCache[raw.username]={allowedClasses:p.map(x=>x.courseId),canImport:p.some(x=>x.canImportData===1),canGrade:p.some(x=>x.canGrade===1),canViewProfile:p.some(x=>x.canViewPortrait===1)}; return {id:raw.id,staffId:raw.username,name:raw.name,teacherId:0,status:raw.status==="ACTIVE"?"active":"disabled",createdAt:""}; };
export async function getTAsByTeacher(_teacherId?:number){const r=await api.get("/teaching-assistants");return (r.data as Raw[]).map(normalize);}
export async function createTA(data:{staffId:string;name:string;password?:string;teacherId?:number}){await api.post("/teaching-assistants",{username:data.staffId,name:data.name,password:data.password||"123456"});}
export async function deleteTA(id:string|number){await api.delete(`/teaching-assistants/${id}`);}
export async function setTAStatus(id:string|number,status:"active"|"disabled"){await api.put(`/teaching-assistants/${id}/status`,{status:status==="active"?"ACTIVE":"DISABLED"});}
export function getTAPermissions(staffId:string):TAPermissions{return permissionCache[staffId]||{allowedClasses:[],canImport:false,canGrade:false,canViewProfile:false};}
export async function assignTAToClass(id:string|number,classId:number,p:Partial<TAPermissions>){await api.put(`/teaching-assistants/${id}/permissions`,{courseId:classId,canViewData:true,canImportData:!!p.canImport,canGrade:!!p.canGrade,canViewPortrait:!!p.canViewProfile});}
export async function removeTAFromClass(id:string|number,classId:number){await api.put(`/teaching-assistants/${id}/permissions`,{courseId:classId,canViewData:false,canImportData:false,canGrade:false,canViewPortrait:false});}
export async function getMyTAPermissions(){const r=await api.get("/teaching-assistants/me/permissions");const p=r.data as any[];return {allowedClasses:p.map(x=>x.courseId),canImport:p.some(x=>x.canImportData===1),canGrade:p.some(x=>x.canGrade===1),canViewProfile:p.some(x=>x.canViewPortrait===1)};}
