export type Principal={userId:string;role:'PARENT'|'STUDENT'|'ADMIN';studentId?:string};
export function mayAccessStudent(actor:Principal,studentId:string,linked:boolean){return actor.role==='STUDENT'?actor.studentId===studentId&&linked:actor.role==='PARENT'&&linked;}
export function mayAccessParent(actor:Principal){return actor.role==='PARENT';}
