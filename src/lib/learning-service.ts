import {orderedOptions} from '../learning-engine/presentation';
import type {Prisma} from '@prisma/client';import {db} from '../db/client';import {ApiError} from './auth';
import type {Question,Mastery,Action} from '../learning-engine/types';
import {evaluate,diagnose} from '../learning-engine/error-detection';import {initialMastery,updateMastery} from '../learning-engine/mastery';
import {scheduleReview} from '../learning-engine/spaced-repetition';import {nextBestAction} from '../learning-engine/next-best-action';
import {activeDelta,focusIndicator} from '../learning-engine/behavior';import {qualityXp,updateStreak} from '../learning-engine/motivation';
import {weeklyMetrics,compareWeeks,weekStart} from '../learning-engine/analytics';
type Tx=Prisma.TransactionClient;
const sessionInclude={answers:{orderBy:{createdAt:'asc' as const}}} as const;
async function approvedQuestions(tx:Tx):Promise<Question[]>{const rows=await tx.question.findMany({where:{contentStatus:'APPROVED'},include:{options:{orderBy:{position:'asc'}},skills:true,visuals:{include:{asset:true}}}});return rows.map(q=>({...q,skillId:q.skills[0]?.skillId??'',subskillId:q.subskillId??undefined,options:q.options.map(o=>o.value),optionErrors:Object.fromEntries(q.options.filter(o=>o.errorTypeId).map(o=>[o.value,o.errorTypeId!])),visualAsset:q.visuals.find(v=>v.asset.contentStatus==='APPROVED')?.asset.id,categories:[]}));}
function safeQuestion(q:Question,sessionId:string){return {id:q.id,skillId:q.skillId,type:q.type,prompt:q.prompt,instruction:q.instruction,options:orderedOptions(q.options,sessionId,q.id),visualAsset:q.visualAsset,estimatedTime:q.estimatedTime};}
async function next(tx:Tx,sessionId:string,studentId:string):Promise<{action:Action;question:ReturnType<typeof safeQuestion>|null;support?:{explanation:string;example:string};progress:{done:number;total:number}}>{
 const session=await tx.learningSession.findUniqueOrThrow({where:{id:sessionId},include:sessionInclude});const mastery=await tx.studentSkillMastery.findMany({where:{studentId}});const map=Object.fromEntries(mastery.map(m=>[m.skillId,m]));const storedSkills=await tx.skill.findMany({include:{prerequisites:true}});const runtimeSkills=storedSkills.map(s=>({...s,parentId:s.parentId??undefined,prerequisites:s.prerequisites.map(p=>p.prerequisiteId)}));const qs=await approvedQuestions(tx);const lesson=session.lessonId?await tx.lesson.findUnique({where:{id:session.lessonId}}):null;const last=session.answers.at(-1);const lastQ=qs.find(q=>q.id===last?.questionId);let failures=0;for(const a of [...session.answers].reverse()){if(a.correct||qs.find(q=>q.id===a.questionId)?.skillId!==lastQ?.skillId)break;failures++;}
 const focus=focusIndicator(session.answers,session.activeMs,Date.now()-session.startedAt.getTime());
 const action=nextBestAction({questions:qs,skills:runtimeSkills,mastery:map,answeredIds:session.answers.map(a=>a.questionId),recentSkillIds:session.answers.map(a=>qs.find(q=>q.id===a.questionId)?.skillId??''),recentTypes:session.answers.map(a=>qs.find(q=>q.id===a.questionId)?.type??''),consecutiveFailures:failures,rescueStage:session.rescueStage,focusDeterioration:focus.deterioration,elapsedMinutes:(Date.now()-session.startedAt.getTime())/60000,targetCount:session.targetCount,now:new Date(),reviewOnly:session.kind==='REVIEW',placement:session.kind==='PLACEMENT',preferredSkillId:lesson?.skillId});
 const q=qs.find(q=>q.id===action.questionId);await tx.learningSession.update({where:{id:sessionId},data:{currentQuestionId:q?.id??null,questionStartedAt:q?new Date():null}});
 return {action,question:q?safeQuestion(q,sessionId):null,support:lastQ?{explanation:lastQ.explanation,example:lastQ.example}:undefined,progress:{done:session.answers.length,total:session.targetCount}};
}
export async function startSession(studentId:string,kind:'LESSON'|'PLACEMENT'|'REVIEW',lessonId?:string){return db.$transaction(async tx=>{
 await tx.$queryRaw`SELECT id FROM "StudentProfile" WHERE id=${studentId} FOR UPDATE`;
 const student=await tx.studentProfile.findUniqueOrThrow({where:{id:studentId}});if(kind!=='PLACEMENT'&&!student.placementCompleted)throw new ApiError(409,'أكمل رحلة اكتشاف المستوى أولًا.');
 if(kind==='PLACEMENT'&&student.placementCompleted)throw new ApiError(409,'اكتمل اكتشاف المستوى من قبل.');
 const prior=await tx.learningSession.findFirst({where:{studentId,status:'ACTIVE'},orderBy:{startedAt:'desc'}});
 if(prior){await tx.learningSession.update({where:{id:prior.id},data:{status:'ABANDONED',endedAt:new Date()}});await tx.learningBehaviorEvent.create({data:{sessionId:prior.id,type:'SESSION_ABANDONED',data:{reason:'new-session'}}});}
 const session=await tx.learningSession.create({data:{studentId,kind,lessonId:kind==='LESSON'?lessonId:undefined,targetCount:kind==='PLACEMENT'?8:6}});
 return {sessionId:session.id,...await next(tx,session.id,studentId)};
 });}
export async function submitAnswer(studentId:string,sessionId:string,questionId:string,answer:string,hintsUsed:number){return db.$transaction(async tx=>{
 await tx.$queryRaw`SELECT id FROM "StudentProfile" WHERE id=${studentId} FOR UPDATE`;
 const session=await tx.learningSession.findFirst({where:{id:sessionId,studentId},include:sessionInclude});if(!session)throw new ApiError(404,'الجلسة غير متاحة.');
 if(session.status!=='ACTIVE')throw new ApiError(409,'اكتملت الجلسة.');if(session.currentQuestionId!==questionId)throw new ApiError(409,'تم تغيير النشاط؛ أعد تحميل الجلسة.');
 const existing=session.answers.find(a=>a.questionId===questionId);if(existing&&existing.answer!==answer)throw new ApiError(409,'تم حفظ إجابة مختلفة لهذا السؤال بالفعل.');
 const q=(await approvedQuestions(tx)).find(q=>q.id===questionId);if(!q)throw new ApiError(404,'السؤال غير متاح.');
 const now=new Date();const priorTime=session.questionStartedAt??session.startedAt;const responseMs=Math.min(600000,Math.max(0,now.getTime()-priorTime.getTime()));const feedback=evaluate(q,answer);
 if(existing){const saved=await tx.studentSkillMastery.findUniqueOrThrow({where:{studentId_skillId:{studentId,skillId:q.skillId}}});return {feedback,mastery:{masteryScore:saved.masteryScore,confidenceScore:saved.confidenceScore},progress:{done:session.answers.length,total:session.targetCount}};}

 const record=await tx.studentAnswer.create({data:{sessionId,questionId,answer,correct:feedback.correct,responseMs,hintsUsed}});
 const repeated=await tx.studentError.count({where:{errorTypeId:q.errorTags[0],answer:{session:{studentId},createdAt:{gte:new Date(now.getTime()-7*86400000)}}}});
 const errors=diagnose(q,answer,repeated);if(errors.length)await tx.studentError.createMany({data:errors.map(e=>({...e,answerId:record.id}))});
 const prior=await tx.studentSkillMastery.findUnique({where:{studentId_skillId:{studentId,skillId:q.skillId}}});const mastery=updateMastery(prior??initialMastery(),{correct:feedback.correct,responseMs,hintsUsed},now);
 const oldReview=await tx.reviewQueue.findUnique({where:{studentId_skillId:{studentId,skillId:q.skillId}}});
 // Rehearsal before a due date does not advance retention stage.
 const dueReview=oldReview&&oldReview.dueAt<=now;
 const review=!feedback.correct?scheduleReview(0,false,now):dueReview?scheduleReview(oldReview.stage,true,now):oldReview?{stage:oldReview.stage,dueAt:oldReview.dueAt,lastResult:oldReview.lastResult}:scheduleReview(-1,true,now);
 mastery.reviewDueAt=review.dueAt;
 const masteryData={masteryScore:mastery.masteryScore,confidenceScore:mastery.confidenceScore,attempts:mastery.attempts,correctAttempts:mastery.correctAttempts,incorrectAttempts:mastery.incorrectAttempts,averageResponseTime:mastery.averageResponseTime,lastAttemptAt:mastery.lastAttemptAt,lastCorrectAt:mastery.lastCorrectAt,retentionEstimate:mastery.retentionEstimate,reviewDueAt:mastery.reviewDueAt};
 await tx.studentSkillMastery.upsert({where:{studentId_skillId:{studentId,skillId:q.skillId}},create:{studentId,skillId:q.skillId,...masteryData},update:masteryData});
 await tx.reviewQueue.upsert({where:{studentId_skillId:{studentId,skillId:q.skillId}},create:{studentId,skillId:q.skillId,...review},update:review});
 await tx.learningBehaviorEvent.create({data:{sessionId,type:'ANSWER_EVALUATED',data:{skillId:q.skillId,correct:feedback.correct,responseMs,hintsUsed}}});
 if(session.rescueStage>=2)await tx.learningSession.update({where:{id:sessionId},data:{rescueStage:feedback.correct?0:session.rescueStage}});
 const pending=await tx.intervention.findMany({where:{sessionId,result:null}});for(const intervention of pending)await tx.interventionResult.create({data:{interventionId:intervention.id,metricsAfter:{correct:feedback.correct,responseMs,evidenceCount:1},result:feedback.correct?'next-attempt-correct':'next-attempt-incorrect'}});
 return {feedback,mastery:{masteryScore:mastery.masteryScore,confidenceScore:mastery.confidenceScore},progress:{done:session.answers.length+1,total:session.targetCount}};
 });}
async function interventionMetrics(tx:Tx,sessionId:string){const answers=await tx.studentAnswer.findMany({where:{sessionId},orderBy:{createdAt:'desc'},take:3});return {accuracy:answers.length?answers.filter(a=>a.correct).length/answers.length:null,averageResponseMs:answers.length?answers.reduce((n,a)=>n+a.responseMs,0)/answers.length:null,evidenceCount:answers.length};}
export async function advanceSession(studentId:string,sessionId:string,supportAcknowledged:boolean){return db.$transaction(async tx=>{
 await tx.$queryRaw`SELECT id FROM "LearningSession" WHERE id=${sessionId} FOR UPDATE`;
 const s=await tx.learningSession.findFirst({where:{id:sessionId,studentId,status:'ACTIVE'}});if(!s)throw new ApiError(404,'الجلسة غير متاحة.');
 if(s.currentQuestionId){const answered=await tx.studentAnswer.findUnique({where:{sessionId_questionId:{sessionId,questionId:s.currentQuestionId}}});if(!answered)throw new ApiError(409,'أجب عن السؤال الحالي أولًا.');}
 if(supportAcknowledged){await tx.learningSession.update({where:{id:sessionId},data:{rescueStage:Math.min(s.rescueStage+1,2)}});await tx.learningBehaviorEvent.create({data:{sessionId,type:'SUPPORT_ACKNOWLEDGED',data:{stage:s.rescueStage}}});}
 const result=await next(tx,sessionId,studentId);
 if(['MICRO_EXPLANATION','SHORT_RESET','WORKED_EXAMPLE'].includes(result.action.type)){const existing=await tx.intervention.findFirst({where:{sessionId,type:result.action.type,result:null}});if(!existing)await tx.intervention.create({data:{sessionId,type:result.action.type,reason:result.action.reason,metricsBefore:{activeMs:s.activeMs,...await interventionMetrics(tx,sessionId)}}});}
 return result;
 });}
async function flushFinalActivity(tx:Tx,session:{id:string;lastHeartbeatAt:Date;answers:{createdAt:Date}[]},now:Date){
 const gap=now.getTime()-session.lastHeartbeatAt.getTime();const lastAnswer=session.answers.at(-1);
 // Flush the last partial heartbeat interval, but never infer active time across a long idle gap.
 const ms=gap<=15000&&lastAnswer&&now.getTime()-lastAnswer.createdAt.getTime()<=30000?activeDelta(session.lastHeartbeatAt,now,true,true):0;
 if(ms>0)await tx.sessionActivity.create({data:{sessionId:session.id,startedAt:session.lastHeartbeatAt,endedAt:now,activeMs:ms}});
 return ms;
}
export async function finishSession(studentId:string,sessionId:string){return db.$transaction(async tx=>{
 await tx.$queryRaw`SELECT id FROM "StudentProfile" WHERE id=${studentId} FOR UPDATE`;
 await tx.$queryRaw`SELECT id FROM "LearningSession" WHERE id=${sessionId} FOR UPDATE`;
 const s=await tx.learningSession.findFirst({where:{id:sessionId,studentId},include:sessionInclude});if(!s)throw new ApiError(404,'الجلسة غير متاحة.');
 if(s.status==='COMPLETED'){const xp=await tx.xpEvent.findUnique({where:{sessionId}});return {xp:xp?.amount??0,correct:s.answers.filter(a=>a.correct).length,total:s.answers.length};}
 if(s.status!=='ACTIVE')throw new ApiError(409,'الجلسة غير نشطة.');
 const decision=await next(tx,sessionId,studentId);if(decision.action.type!=='END_SESSION')throw new ApiError(409,'أكمل الأنشطة أولًا.');
 const now=new Date();const finalActiveMs=await flushFinalActivity(tx,s,now);const correct=s.answers.filter(a=>a.correct).length;const amount=qualityXp(correct,s.answers.length);
 await tx.learningSession.update({where:{id:sessionId},data:{status:'COMPLETED',endedAt:now,currentQuestionId:null,lastHeartbeatAt:now,activeMs:{increment:finalActiveMs}}});
 if(s.kind==='PLACEMENT'&&s.answers.length>=8)await tx.studentProfile.update({where:{id:studentId},data:{placementCompleted:true}});
 if(s.answers.length>0){await tx.xpEvent.create({data:{studentId,sessionId,amount,reason:'correct-answers-and-quality'}});
 const profile=await tx.studentProfile.findUniqueOrThrow({where:{id:studentId}});const prior=await tx.streak.findUnique({where:{studentId}});const streak=updateStreak(prior??{current:0,longest:0,lastLearningDate:null},new Date(),profile.timezone);await tx.streak.upsert({where:{studentId},create:{studentId,...streak},update:streak});
 const award=async(achievementId:string)=>tx.studentAchievement.upsert({where:{studentId_achievementId:{studentId,achievementId}},create:{studentId,achievementId},update:{}});
 if(s.kind==='LESSON')await award('first-lesson');if(s.answers.length>=5&&correct/s.answers.length>=.8)await award('accurate');if(s.kind==='REVIEW'&&correct>=3)await award('retained');
 const characterId=s.kind==='REVIEW'?'elephant':'panda';await tx.studentCharacterProgress.upsert({where:{studentId_characterId:{studentId,characterId}},create:{studentId,characterId},update:{}});
 await tx.studentReward.upsert({where:{studentId_key:{studentId,key:sessionId}},create:{studentId,key:sessionId,reason:`${correct} correct answers`},update:{}});
 }
 const focus=focusIndicator(s.answers,s.activeMs+finalActiveMs,now.getTime()-s.startedAt.getTime());await tx.focusMetric.create({data:{sessionId,score:focus.score,evidenceCount:focus.evidenceCount,indicators:{observations:focus.observations,deterioration:focus.deterioration}}});
 return {xp:amount,correct,total:s.answers.length};
 });}
export async function heartbeat(studentId:string,sessionId:string,visible:boolean,recentInput:boolean){return db.$transaction(async tx=>{
 await tx.$queryRaw`SELECT id FROM "LearningSession" WHERE id=${sessionId} FOR UPDATE`;
 const s=await tx.learningSession.findFirst({where:{id:sessionId,studentId,status:'ACTIVE'}});if(!s)throw new ApiError(404,'الجلسة غير نشطة.');const now=new Date();const ms=activeDelta(s.lastHeartbeatAt,now,visible,recentInput);
 await tx.learningSession.update({where:{id:sessionId},data:{lastHeartbeatAt:now,activeMs:{increment:ms}}});
 if(ms>0)await tx.sessionActivity.create({data:{sessionId,startedAt:new Date(now.getTime()-ms),endedAt:now,activeMs:ms}});return {activeMs:s.activeMs+ms};
 });}
export async function dashboard(studentId:string){
 const [profile,mastery,reviews,sessions,xp,streak,achievements,characters,lessons,allSkills]=await Promise.all([db.studentProfile.findUniqueOrThrow({where:{id:studentId}}),db.studentSkillMastery.findMany({where:{studentId},include:{skill:true}}),db.reviewQueue.findMany({where:{studentId,dueAt:{lte:new Date()}},include:{skill:true}}),db.learningSession.findMany({where:{studentId},include:{answers:{include:{question:{include:{skills:true}}}},focus:true},orderBy:{startedAt:'desc'}}),db.xpEvent.aggregate({where:{studentId},_sum:{amount:true}}),db.streak.findUnique({where:{studentId}}),db.studentAchievement.findMany({where:{studentId},include:{achievement:true}}),db.studentCharacterProgress.findMany({where:{studentId},include:{character:true}}),db.lesson.findMany({orderBy:{position:'asc'}}),db.skill.findMany()]);
 const start=weekStart(new Date()),previousStart=new Date(start.getTime()-7*86400000);const current=weeklyMetrics(sessions,start),previous=weeklyMetrics(sessions,previousStart);
 const skillTrend=mastery.map(m=>{const currentAnswers=sessions.flatMap(s=>s.answers).filter(a=>a.createdAt>=start&&a.question.skills.some(q=>q.skillId===m.skillId));const previousAnswers=sessions.flatMap(s=>s.answers).filter(a=>a.createdAt>=previousStart&&a.createdAt<start&&a.question.skills.some(q=>q.skillId===m.skillId));let reconstructed:Mastery=initialMastery();const all=sessions.flatMap(s=>s.answers).filter(a=>a.question.skills.some(q=>q.skillId===m.skillId)).sort((a,b)=>a.createdAt.getTime()-b.createdAt.getTime());let before=initialMastery().masteryScore;for(const a of all){reconstructed=updateMastery(reconstructed,a,a.createdAt);if(a.createdAt<start)before=reconstructed.masteryScore;}let category=m.skillId;const seen=new Set<string>();while(!seen.has(category)){seen.add(category);const parent=allSkills.find(s=>s.id===category)?.parentId;if(!parent)break;category=parent;}return {categoryId:category,skillId:m.skillId,title:m.skill.title,mastery:m.masteryScore,confidence:m.confidenceScore,attempts:m.attempts,change:currentAnswers.length?m.masteryScore-before:null,thisWeekAttempts:currentAnswers.length,lastWeekAttempts:previousAnswers.length};});
 const focusRows=sessions.filter(s=>s.startedAt>=start).flatMap(s=>s.focus).filter(f=>f.score!==null);const focusScore=focusRows.length?Math.round(focusRows.reduce((n,f)=>n+f.score!,0)/focusRows.length):null;
 const bestWeek=new Map<string,number>();for(const s of sessions){const key=weekStart(s.startedAt).toISOString();bestWeek.set(key,(bestWeek.get(key)??0)+s.activeMs);}
 const improving=skillTrend.filter(s=>s.change!==null&&s.change>0),practice=skillTrend.filter(s=>s.mastery<.65).sort((a,b)=>a.mastery-b.mastery);
 return {profile,mastery:skillTrend,reviews,weekly:current,previous,comparison:compareWeeks(current,previous),focusScore,focusEvidence:focusRows.length,xp:xp._sum.amount??0,streak:streak?.current??0,longestStreak:streak?.longest??0,achievements:achievements.map(a=>a.achievement),characters:characters.map(c=>c.character),lessons:lessons.map(l=>({...l,completed:sessions.some(s=>s.lessonId===l.id&&s.status==='COMPLETED')})),improving:improving.map(s=>s.title),recommendation:practice[0]?`جلستان قصيرتان للتدرب على ${practice[0].title}، مع مراجعة الكلمات المستحقة.`:'واصل دروسك القصيرة، ثم راجع ما تعلمته.',personalBestMinutes:Math.round(Math.max(0,...bestWeek.values())/60000),sessionCount:sessions.length,completedLessons:sessions.filter(s=>s.status==='COMPLETED'&&s.kind==='LESSON').length};
}
export async function publicCurriculum(){const [skills,count]=await Promise.all([db.skill.findMany({select:{id:true,title:true,parentId:true,prerequisites:{select:{prerequisiteId:true}}}}),db.question.count({where:{contentStatus:'APPROVED'}})]);return {skills:skills.map(s=>({...s,prerequisites:s.prerequisites.map(p=>p.prerequisiteId)})),questions:count};}

export async function abandonSession(studentId:string,sessionId:string){return db.$transaction(async tx=>{
 await tx.$queryRaw`SELECT id FROM "LearningSession" WHERE id=${sessionId} FOR UPDATE`;
 const s=await tx.learningSession.findFirst({where:{id:sessionId,studentId},include:sessionInclude});if(!s)throw new ApiError(404,'الجلسة غير متاحة.');
 if(s.status==='ACTIVE'){const now=new Date();const finalActiveMs=await flushFinalActivity(tx,s,now);await tx.learningSession.update({where:{id:sessionId},data:{status:'ABANDONED',endedAt:now,currentQuestionId:null,lastHeartbeatAt:now,activeMs:{increment:finalActiveMs}}});await tx.learningBehaviorEvent.create({data:{sessionId,type:'SESSION_ABANDONED',data:{reason:'left-session'}}});}return {ok:true};
 });}
