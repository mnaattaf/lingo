import {engineConfig} from './config';
export function scheduleReview(stage:number,correct:boolean,now:Date){
 const nextStage=correct?Math.min(Math.max(stage+1,0),engineConfig.reviewDays.length-1):0;
 const days=engineConfig.reviewDays[nextStage];
 return {stage:nextStage,dueAt:new Date(now.getTime()+days*86400000),lastResult:correct};
}
