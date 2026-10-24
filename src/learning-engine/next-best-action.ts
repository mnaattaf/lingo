import {engineConfig} from './config';import {unlocked} from './skill-graph';
import type {Question,Skill,Mastery,Action} from './types';
export type SelectionContext={questions:Question[];skills:Skill[];mastery:Record<string,Mastery>;answeredIds:string[];recentSkillIds:string[];recentTypes:string[];consecutiveFailures:number;rescueStage:number;focusDeterioration:boolean;elapsedMinutes:number;targetCount:number;now:Date;reviewOnly?:boolean;placement?:boolean;preferredSkillId?:string;recentQuestionIds?:string[];weights?:Record<keyof typeof engineConfig.weights,number>};
export function nextBestAction(c:SelectionContext):Action{
 if(c.answeredIds.length>=c.targetCount||c.elapsedMinutes>=engineConfig.maxSessionMinutes)return {type:'END_SESSION',reason:'اكتملت خطوات اليوم، أحسنت!'};
 if(c.focusDeterioration&&c.rescueStage===0)return {type:'SHORT_RESET',reason:'لنأخذ استراحة قصيرة ثم نجرب نشاطًا مختلفًا.'};
 if(c.consecutiveFailures>=engineConfig.rescueAfter){
  if(c.rescueStage===0)return {type:'MICRO_EXPLANATION',reason:'لنراجع الفكرة معًا.'};
  if(c.rescueStage===1)return {type:'WORKED_EXAMPLE',reason:'نشاهد مثالًا محلولًا أولًا.'};
 }
 const w=c.weights??engineConfig.weights;
 const available=c.questions.filter(q=>!c.answeredIds.includes(q.id)).filter(q=>{const s=c.skills.find(s=>s.id===q.skillId);return s&&(c.placement||unlocked(s,c.mastery));});
 const due=(id:string)=>!!c.mastery[id]?.reviewDueAt&&c.mastery[id].reviewDueAt!<=c.now;
 let pool=available;
 if(c.reviewOnly){pool=pool.filter(q=>due(q.skillId));}
 else if(!c.placement&&c.rescueStage<2){
  const bucket=mixBucket(c.answeredIds.length,engineConfig.sessionMix);
  if(bucket==='review'){const reviews=pool.filter(q=>due(q.skillId));if(reviews.length)pool=reviews;}
  else if(bucket==='remediation'){const weak=pool.filter(q=>(c.mastery[q.skillId]?.masteryScore??.2)<.6);if(weak.length)pool=weak;}
  else if(c.preferredSkillId){const current=pool.filter(q=>q.skillId===c.preferredSkillId);if(current.length)pool=current;}
 }
 if(c.rescueStage>=2){const easy=pool.filter(q=>q.skillId===c.recentSkillIds.at(-1)&&q.difficulty<=1);if(easy.length)pool=easy;}
 // Prefer unseen alternatives inside the chosen learning/review bucket. Never suppress a due skill.
 const fresh=pool.filter(q=>!c.recentQuestionIds?.includes(q.id));if(fresh.length)pool=fresh;
 const ranked=pool.map(q=>{const m=c.mastery[q.skillId];const recent=c.recentSkillIds.slice(-2);const variety=(c.recentTypes.at(-1)!==q.type? .5:0)+(recent.includes(q.skillId)?0:.5);const fit=1-Math.min(1,Math.abs(q.difficulty-(1+(m?.masteryScore??.2)*2))/3);const prereqNeed=c.skills.some(s=>s.prerequisites.includes(q.skillId))?1:0;
 return {q,score:w.weakness*(1-(m?.masteryScore??.2))+w.reviewDue*(due(q.skillId)?1:0)+w.prerequisite*prereqNeed+w.difficultyFit*fit+w.variety*variety-(recent.length===2&&recent.every(s=>s===q.skillId)?.25:0)};}).sort((a,b)=>b.score-a.score||a.q.id.localeCompare(b.q.id));
 const q=ranked[0]?.q;if(!q)return {type:'END_SESSION',reason:'انتهت الأنشطة المناسبة المتاحة اليوم.'};
 const type=c.rescueStage>=2?'EASIER_QUESTION':c.focusDeterioration&&q.visualAsset?'VISUAL_QUESTION':due(q.skillId)?'REVIEW_QUESTION':c.recentTypes.at(-1)!==q.type?'CHANGE_ACTIVITY':(c.mastery[q.skillId]?.masteryScore??0)>.75?'HARDER_QUESTION':'NEW_QUESTION';
 return {type,questionId:q.id,skillId:q.skillId,reason:due(q.skillId)?'حان وقت تثبيت ما تعلمته.':'نشاط يناسب خطواتك الحالية.'};
}

export function mixBucket(index:number,mix:{current:number;remediation:number;review:number}):'current'|'remediation'|'review'{
 const keys=['current','remediation','review'] as const;const counts={current:0,remediation:0,review:0};let selected:typeof keys[number]='current';
 for(let step=0;step<=index%20;step++){selected=keys.reduce((best,key)=>mix[key]*(step+1)-counts[key]>mix[best]*(step+1)-counts[best]?key:best,'current');counts[selected]++;}return selected;
}
