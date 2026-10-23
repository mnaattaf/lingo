export function dateKey(now:Date,timezone='Africa/Cairo'){return new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function updateStreak(previous:{current:number;longest:number;lastLearningDate:string|null},now:Date,timezone:string){
 const today=dateKey(now,timezone);if(previous.lastLearningDate===today)return previous;
 const prior=previous.lastLearningDate?Date.parse(previous.lastLearningDate):0;const difference=(Date.parse(today)-prior)/86400000;
 const current=difference===1?previous.current+1:1;return {current,longest:Math.max(current,previous.longest),lastLearningDate:today};
}
export function qualityXp(correct:number,total:number){return total<1?0:Math.min(100,correct*10+(correct/total>=.8?10:0));}
