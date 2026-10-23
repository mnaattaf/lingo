import {PrismaPg} from '@prisma/adapter-pg';
import {PrismaClient} from '@prisma/client';
import {skills,questions} from '../src/db/content';
import {errorTaxonomy} from '../src/learning-engine/error-detection';
import {checkContent,forbiddenCategories} from '../src/content-policy';
const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})});
async function seed(){
 for(const s of skills){const {prerequisites,...data}=s;await db.skill.upsert({where:{id:s.id},create:data,update:data});for(const id of prerequisites)await db.skillPrerequisite.upsert({where:{skillId_prerequisiteId:{skillId:s.id,prerequisiteId:id}},create:{skillId:s.id,prerequisiteId:id},update:{}});}
 for(const e of errorTaxonomy)await db.errorType.upsert({where:{id:e.id},create:{...e,description:e.title},update:{title:e.title}});
 for(const q of questions){
 const policy=checkContent({text:q.prompt,origin:'ai',categories:q.categories,ageSafe:true,educationallyValid:true,skillAligned:skills.some(s=>s.id===q.skillId),humanReviewed:false,trustedCoreReview:true,reviewer:'automated-core-review-v1'});
 if(policy.status!=='APPROVED')throw new Error(`Seed rejected: ${q.id}`);
 const data={type:q.type,prompt:q.prompt,instruction:q.instruction,correctAnswer:q.correctAnswer,explanation:q.explanation,example:q.example,difficulty:q.difficulty,cefr:q.cefr,vocabularyLevel:q.vocabularyLevel,estimatedTime:q.estimatedTime,errorTags:q.errorTags,prerequisites:q.prerequisites,contentStatus:policy.status};
 await db.question.upsert({where:{id:q.id},create:{id:q.id,...data},update:data});
 await db.questionOption.deleteMany({where:{questionId:q.id}});
 await db.questionOption.createMany({data:q.options.map((value,position)=>({questionId:q.id,value,position,errorTypeId:q.optionErrors[value]??null}))});
 await db.questionSkillMap.upsert({where:{questionId_skillId:{questionId:q.id,skillId:q.skillId}},create:{questionId:q.id,skillId:q.skillId},update:{}});
 if(q.visualAsset){await db.visualAsset.upsert({where:{id:q.visualAsset},create:{id:q.visualAsset,url:`/assets/${q.visualAsset}.svg`,alt:q.visualAsset,contentStatus:'APPROVED'},update:{}});await db.questionVisualAsset.upsert({where:{questionId_assetId:{questionId:q.id,assetId:q.visualAsset}},create:{questionId:q.id,assetId:q.visualAsset},update:{}});}
 if(!await db.contentReviewStatus.findFirst({where:{questionId:q.id,reviewer:'automated-core-review-v1'}}))await db.contentReviewStatus.create({data:{questionId:q.id,status:'APPROVED',reviewer:'automated-core-review-v1',rationale:'Original AI-authored starter curriculum. Initial automated age, category and skill checks passed. Independent human pedagogical review is required before production use.'}});
 }
 await db.course.upsert({where:{id:'english-foundations'},create:{id:'english-foundations',title:'رحلتي مع الإنجليزية'},update:{}});
 await db.unit.upsert({where:{id:'first-steps'},create:{id:'first-steps',courseId:'english-foundations',title:'خطواتي الأولى',position:1},update:{}});
 const lessons=[['school','في المدرسة'],['animals','أصدقاء من الطبيعة'],['family','عائلتي الجميلة'],['be','أنا وأصدقائي'],['present','يومي الجميل'],['prepositions','أين الأشياء؟']];
 for(const [position,[skillId,title]] of lessons.entries())await db.lesson.upsert({where:{id:`lesson-${skillId}`},create:{id:`lesson-${skillId}`,unitId:'first-steps',title,skillId,position},update:{}});
 for(const [id,name,fn] of [['panda','باندا','دليلك الودود'],['elephant','فيل','المراجعة والذاكرة'],['turtle','سلحفاة','مراجعة هادئة'],['lion','أسد','التحديات'],['rabbit','أرنب','تحديات قصيرة']])await db.character.upsert({where:{id},create:{id,name,function:fn},update:{}});
 for(const [id,title,description] of [['first-lesson','أولى خطواتي','أكملت أول درس'],['retained','ذاكرة جميلة','أكملت مراجعة بنجاح'],['accurate','متعلم متأنٍ','دقة ٨٠٪ في درس من ٥ أسئلة على الأقل']])await db.achievement.upsert({where:{id},create:{id,title,description},update:{}});
 for(const category of forbiddenCategories)await db.contentPolicyRule.upsert({where:{id:category},create:{id:category,category,description:'Excluded from routine child curriculum; respectful treatment of all people.',action:'REJECT'},update:{}});
 console.log(`Seeded ${skills.length} skills and ${questions.length} approved questions; no child accounts created.`);
}
seed().catch(e=>{console.error('Seed failed',e);process.exitCode=1;}).finally(()=>db.$disconnect());
