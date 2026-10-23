import {orderedOptions} from '../learning-engine/presentation';
import {describe,it,expect} from 'vitest';
import {initialMastery,updateMastery,isMastered} from '../learning-engine/mastery';
import {scheduleReview} from '../learning-engine/spaced-repetition';
import {nextBestAction,mixBucket,type SelectionContext} from '../learning-engine/next-best-action';
import {diagnose,evaluate,errorTaxonomy} from '../learning-engine/error-detection';
import {activeDelta,focusIndicator,optimalLength} from '../learning-engine/behavior';
import {updateStreak} from '../learning-engine/motivation';
import {weeklyMetrics,compareWeeks,weekStart} from '../learning-engine/analytics';
import {validateGraph} from '../learning-engine/skill-graph';
import {skills,questions} from '../db/content';
import {checkContent} from '../content-policy';
const now=new Date('2026-10-23T12:00:00Z');
const context:SelectionContext={questions,skills,mastery:{},answeredIds:[],recentSkillIds:[],recentTypes:[],consecutiveFailures:0,rescueStage:0,focusDeterioration:false,elapsedMinutes:1,targetCount:6,now};
describe('knowledge model',()=>{
 it('separates confidence from mastery and prevents one-answer mastery',()=>{const m=updateMastery(initialMastery(),{correct:true,responseMs:3000,hintsUsed:0},now);expect(m.masteryScore).toBeLessThan(.5);expect(m.confidenceScore).toBeGreaterThan(0);expect(isMastered(m)).toBe(false);});
 it('requires repeated evidence',()=>{let m=initialMastery();for(let i=0;i<40;i++)m=updateMastery(m,{correct:true,responseMs:3000,hintsUsed:0},now);expect(isMastered(m)).toBe(true);expect(m.correctAttempts).toBe(40);expect(m.lastCorrectAt).toEqual(now);});
 it('lowers mastery after failure and preserves last correct',()=>{const good=updateMastery(initialMastery(),{correct:true,responseMs:3000,hintsUsed:0},now);const bad=updateMastery(good,{correct:false,responseMs:6000,hintsUsed:0},now);expect(bad.masteryScore).toBeLessThan(good.masteryScore);expect(bad.lastCorrectAt).toEqual(now);expect(bad.incorrectAttempts).toBe(1);});
 it('rapid guesses provide less confidence',()=>{expect(updateMastery(initialMastery(),{correct:true,responseMs:100,hintsUsed:0},now).confidenceScore).toBeLessThan(updateMastery(initialMastery(),{correct:true,responseMs:3000,hintsUsed:0},now).confidenceScore);});
 it('rejects invalid timings',()=>expect(()=>updateMastery(initialMastery(),{correct:true,responseMs:-1,hintsUsed:0},now)).toThrow());
});
describe('reviews and progression',()=>{
 it('starts at one day and caps at thirty',()=>{expect(scheduleReview(-1,true,now).dueAt.getTime()-now.getTime()).toBe(86400000);expect(scheduleReview(100,true,now).stage).toBe(4);});
 it('resets retained failure to one day',()=>expect(scheduleReview(4,false,now).stage).toBe(0));
 it('has a valid acyclic graph',()=>expect(validateGraph(skills)).toBe(true));
 it('rejects unknown prerequisites and cycles',()=>{expect(()=>validateGraph([{...skills[0],prerequisites:['missing']}])).toThrow();expect(()=>validateGraph([{...skills[0],prerequisites:[skills[0].id]}])).toThrow();});
 it('selects deterministically and respects prerequisites',()=>{expect(nextBestAction(context)).toEqual(nextBestAction(context));expect(questions.find(q=>q.id===nextBestAction(context).questionId)?.prerequisites.length).toBe(0);});
 it('never repeats an answered question',()=>{const first=nextBestAction(context);expect(nextBestAction({...context,answeredIds:[first.questionId!]}).questionId).not.toBe(first.questionId);});
 it('ends an exhausted pool safely',()=>expect(nextBestAction({...context,questions:[]}).type).toBe('END_SESSION'));
 it('rescues before another failure loop',()=>{expect(nextBestAction({...context,consecutiveFailures:2}).type).toBe('MICRO_EXPLANATION');expect(nextBestAction({...context,consecutiveFailures:2,rescueStage:1}).type).toBe('WORKED_EXAMPLE');});
 it('offers a reset for performance deterioration',()=>expect(nextBestAction({...context,focusDeterioration:true}).type).toBe('SHORT_RESET'));
 it('does not invent review items',()=>expect(nextBestAction({...context,reviewOnly:true}).type).toBe('END_SESSION'));
 it('ends long sessions',()=>expect(nextBestAction({...context,elapsedMinutes:26}).type).toBe('END_SESSION'));
});
describe('feedback',()=>{
 it('classifies missing s with probability',()=>{const q=questions.find(q=>q.id==='s-1')!;expect(diagnose(q,'go')[0]).toMatchObject({errorTypeId:'missing-s',probability:.9});expect(evaluate(q,'go').explanation).toContain('He');});
 it('does not label a single error careless',()=>expect(diagnose(questions[0],'a chair').some(e=>e.errorTypeId==='possible-careless')).toBe(false));
 it('accepts punctuation and case variants',()=>expect(evaluate(questions.find(q=>q.id==='blank-1')!,' Book. ').correct).toBe(true));
 it('all seed questions measure known skills and errors',()=>{for(const q of questions){expect(skills.some(s=>s.id===q.skillId)).toBe(true);for(const tag of q.errorTags)expect(errorTaxonomy.some(e=>e.id===tag)).toBe(true);}});
});
describe('behavior and rewards',()=>{
 it('caps heartbeat gaps and excludes idle/hidden time',()=>{expect(activeDelta(new Date(now.getTime()-60000),now,true,true)).toBe(15000);expect(activeDelta(now,now,false,true)).toBe(0);expect(activeDelta(new Date(now.getTime()-5000),now,true,false)).toBe(0);});
 it('does not infer focus from insufficient data',()=>expect(focusIndicator([],0,1000).score).toBeNull());
 it('detects deterioration without diagnosis',()=>{const a=[...Array.from({length:3},()=>({correct:true,responseMs:2000})),...Array.from({length:3},()=>({correct:false,responseMs:8000}))];expect(focusIndicator(a,30000,60000).deterioration).toBe(true);});
 it('requires enough evidence for session length patterns',()=>expect(optimalLength([{minutes:15,answers:5,accuracy:1}])).toBeNull());
 it('streak is idempotent on same local day',()=>{const s=updateStreak({current:2,longest:3,lastLearningDate:'2026-10-22'},now,'Africa/Cairo');expect(s.current).toBe(3);expect(updateStreak(s,now,'Africa/Cairo')).toEqual(s);});
 it('resets streak after a gap and handles local midnight',()=>{expect(updateStreak({current:5,longest:5,lastLearningDate:'2026-10-20'},now,'Africa/Cairo').current).toBe(1);expect(updateStreak({current:1,longest:1,lastLearningDate:'2026-10-23'},new Date('2026-10-23T22:30:00Z'),'Africa/Cairo').current).toBe(2);});
 it('handles week boundaries and missing previous evidence',()=>{const current=weeklyMetrics([{startedAt:now,status:'COMPLETED',kind:'LESSON',activeMs:60000,answers:[{correct:true,createdAt:now}]}],new Date('2026-10-19'));const prev=weeklyMetrics([],new Date('2026-10-12'));expect(current.accuracy).toBe(100);expect(compareWeeks(current,prev).accuracy.change).toBeNull();expect(compareWeeks(current,prev).activeMinutes.change).toBe(1);});
});
describe('content policy',()=>{
 const good={origin:'human' as const,text:'I help my mother.',categories:['family'],ageSafe:true,educationallyValid:true,skillAligned:true,humanReviewed:true,reviewer:'editor'};
 it('approves reviewed safe aligned content',()=>expect(checkContent(good).status).toBe('APPROVED'));
 it('rejects category violations even when reviewed',()=>expect(checkContent({...good,categories:['gambling']}).status).toBe('REJECTED'));
 it('quarantines AI and unknown semantic checks',()=>expect(checkContent({...good,origin:'ai',humanReviewed:false,ageSafe:null}).status).toBe('REVIEW_NEEDED'));
 it('holds unreviewed visual assets',()=>expect(checkContent({...good,assetReviewed:false}).status).toBe('REVIEW_NEEDED'));
 it('rejects invalid educational alignment',()=>expect(checkContent({...good,skillAligned:false}).status).toBe('REJECTED'));
});

describe('configurable short-session cadence and local calendars',()=>{
 it('interleaves remediation/review into six answers and realizes 60/25/15 across twenty',()=>{const mix={current:.6,remediation:.25,review:.15};const slots=Array.from({length:20},(_,i)=>mixBucket(i,mix));expect(slots.filter(x=>x==='current')).toHaveLength(12);expect(slots.filter(x=>x==='remediation')).toHaveLength(5);expect(slots.filter(x=>x==='review')).toHaveLength(3);expect(slots.slice(0,6)).toContain('review');expect(slots.slice(0,6)).toContain('remediation');});
 it('allows a configured alternate mix',()=>expect(Array.from({length:6},(_,i)=>mixBucket(i,{current:0,remediation:0,review:1}))).toEqual(Array(6).fill('review')));
 it('Cairo week starts at local Monday midnight',()=>{expect(weekStart(new Date('2026-10-18T22:00:00Z')).toISOString()).toBe('2026-10-18T21:00:00.000Z');});
});

describe('question presentation',()=>{
 it('is deterministic and preserves every repeated token',()=>{const words=['I','see','a','cat','and','a','dog'];expect(orderedOptions(words,'s1','q1')).toEqual(orderedOptions(words,'s1','q1'));expect(orderedOptions(words,'s1','q1').sort()).toEqual([...words].sort());});
 it('does not expose the authored first option as the correct slot in every session',()=>{const positions=Array.from({length:20},(_,i)=>orderedOptions(['correct','second','third'],'session-'+i,'q1').indexOf('correct'));expect(new Set(positions).size).toBe(3);});
});
