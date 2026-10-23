import {engineConfig} from './config';
export function activeDelta(last:Date,now:Date,visible:boolean,recentInput:boolean){const delta=now.getTime()-last.getTime();return visible&&recentInput&&delta>0?Math.min(delta,engineConfig.heartbeatLimitMs):0;}
export function focusIndicator(answers:{correct:boolean;responseMs:number}[],activeMs:number,durationMs:number){
 if(answers.length<engineConfig.minimumFocusAnswers)return {score:null,evidenceCount:answers.length,deterioration:false,observations:['لا توجد بيانات كافية بعد.']};
 const half=Math.floor(answers.length/2),first=answers.slice(0,half),last=answers.slice(half);
 const accuracy=(a:typeof answers)=>a.filter(x=>x.correct).length/a.length;
 const mean=(a:typeof answers)=>a.reduce((n,x)=>n+x.responseMs,0)/a.length;
 const drop=accuracy(first)-accuracy(last)>.3;const slower=mean(last)>mean(first)*1.8;const rapid=last.filter(x=>x.responseMs<900).length/last.length>.4;
 const activeRatio=durationMs>0?Math.min(1,activeMs/durationMs):0;
 return {score:Math.round(Math.max(0,Math.min(100,activeRatio*100-(drop?15:0)-(slower?10:0)-(rapid?15:0)))),evidenceCount:answers.length,deterioration:drop&&(slower||rapid),observations:[...(drop?['ظهرت مؤشرات على انخفاض الأداء في نهاية الجلسة.']:[]),...(rapid?['ظهرت إجابات سريعة جدًا؛ قد يفيد تغيير النشاط.']:[])]};
}
export function optimalLength(sessions:{minutes:number;answers:number;accuracy:number}[]){if(sessions.length<engineConfig.minimumPatternSessions||sessions.reduce((n,s)=>n+s.answers,0)<engineConfig.minimumPatternAnswers)return null;
 const buckets=[[0,15],[15,25],[25,35],[35,Infinity]];return buckets.map(([from,to])=>{const group=sessions.filter(s=>s.minutes>=from&&s.minutes<to);return {from,to,evidence:group.length,accuracy:group.length>=3?group.reduce((n,s)=>n+s.accuracy,0)/group.length:null};});}
