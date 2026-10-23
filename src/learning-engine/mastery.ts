import type {Attempt,Mastery} from './types';
export const initialMastery = ():Mastery => ({masteryScore:.2,confidenceScore:0,attempts:0,correctAttempts:0,incorrectAttempts:0,averageResponseTime:0,lastAttemptAt:null,lastCorrectAt:null,retentionEstimate:0,reviewDueAt:null});
export function updateMastery(previous:Mastery, answer:Attempt, now:Date):Mastery {
 if(!Number.isFinite(answer.responseMs)||answer.responseMs<0) throw new Error('Invalid response time');
 const quality=answer.skipped?0:answer.correct?(answer.hintsUsed>0?.55:answer.responseMs<900?.35:1):0;
 const evidence=previous.attempts+6;
 const alpha=previous.masteryScore*evidence+quality;
 const beta=(1-previous.masteryScore)*evidence+(1-quality);
 // Conservative beta prior: a single success cannot establish mastery.
 const attempts=previous.attempts+1;
 const evidenceQuality=answer.responseMs<900?.3:answer.hintsUsed>0?.6:1;
 return {...previous,masteryScore:alpha/(alpha+beta),confidenceScore:Math.min(.99,previous.confidenceScore+(1-previous.confidenceScore)*.12*evidenceQuality),attempts,correctAttempts:previous.correctAttempts+(answer.correct?1:0),incorrectAttempts:previous.incorrectAttempts+(answer.correct?0:1),averageResponseTime:(previous.averageResponseTime*previous.attempts+answer.responseMs)/attempts,lastAttemptAt:now,lastCorrectAt:answer.correct?now:previous.lastCorrectAt,retentionEstimate:answer.correct?Math.min(.99,previous.retentionEstimate+.12*quality):previous.retentionEstimate*.6};
}
export function isMastered(m:Mastery,threshold=.8){return m.attempts>=8&&m.confidenceScore>=.6&&m.masteryScore>=threshold;}
