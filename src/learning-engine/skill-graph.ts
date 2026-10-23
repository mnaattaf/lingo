import type {Skill,Mastery} from './types';
import {isMastered} from './mastery';
export function validateGraph(skills:Skill[]){
 const map=new Map(skills.map(s=>[s.id,s]));const visiting=new Set<string>();const done=new Set<string>();
 function visit(id:string){if(visiting.has(id))throw new Error('Skill cycle');if(done.has(id))return;const s=map.get(id);if(!s)throw new Error('Unknown skill '+id);visiting.add(id);for(const p of [...s.prerequisites,...(s.parentId?[s.parentId]:[])])visit(p);visiting.delete(id);done.add(id);}
 for(const s of skills)visit(s.id);return true;
}
export function unlocked(skill:Skill,mastery:Record<string,Mastery>){return skill.prerequisites.every(id=>mastery[id]&&isMastered(mastery[id]));}
