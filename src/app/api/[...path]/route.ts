import {NextRequest,NextResponse} from 'next/server';import {cookies} from 'next/headers';import {z,ZodError} from 'zod';import {hash,compare} from 'bcryptjs';import {createHash} from 'node:crypto';
import {db} from '@/db/client';import {actor,requireParent,requireStudent,setSession,ApiError} from '@/lib/auth';
import {dashboard,abandonSession,startSession,submitAnswer,advanceSession,finishSession,heartbeat,publicCurriculum} from '@/lib/learning-service';import {weekStart} from '@/learning-engine/analytics';
export const runtime='nodejs';export const dynamic='force-dynamic';
const credentials=z.object({email:z.email().max(254).transform(v=>v.toLowerCase().trim()),password:z.string().min(10).max(128)});
const onboarding=z.object({nickname:z.string().trim().min(1).max(30),age:z.number().int().min(4).max(17),grade:z.string().max(30),goalMinutes:z.number().int().min(5).max(25)});
const sid=z.string().min(1).max(100);
async function authAttempt(email:string){const key=createHash('sha256').update(email).digest('hex');const now=new Date();return db.$transaction(async tx=>{
 await tx.authThrottle.upsert({where:{key},create:{key},update:{}});await tx.$queryRaw`SELECT key FROM "AuthThrottle" WHERE key=${key} FOR UPDATE`;const row=await tx.authThrottle.findUniqueOrThrow({where:{key}});
 if(row.blockedUntil&&row.blockedUntil>now)throw new ApiError(429,'محاولات كثيرة. حاول بعد ربع ساعة.');
 const failures=now.getTime()-row.windowStart.getTime()>900000?1:row.failures+1;await tx.authThrottle.update({where:{key},data:{failures,windowStart:failures===1?now:row.windowStart,blockedUntil:failures>=8?new Date(now.getTime()+900000):null}});return key;
 });}
async function handle(req:NextRequest,context:{params:Promise<{path:string[]}>}){
 const path=(await context.params).path.join('/');
 try{
 if(req.method!=='GET'){
  if(req.headers.get('sec-fetch-site')==='cross-site')throw new ApiError(403,'مصدر الطلب غير مقبول.');
  const origin=req.headers.get('origin');const trustedOrigin=process.env.APP_ORIGIN;if(origin&&(trustedOrigin?origin!==trustedOrigin:new URL(origin).host!==req.headers.get('host')))throw new ApiError(403,'مصدر الطلب غير مقبول.');
  if(Number(req.headers.get('content-length')??0)>16000)throw new ApiError(413,'الطلب أكبر من المسموح.');
 }
 const json=async()=>{const raw=await req.text();if(raw.length>16000)throw new ApiError(413,'الطلب أكبر من المسموح.');try{return JSON.parse(raw||'{}');}catch{throw new ApiError(400,'بيانات غير صالحة.');}};
 let result:unknown;
 if(path==='curriculum'&&req.method==='GET')result=await publicCurriculum();
 else if(['auth/register','auth/login'].includes(path)&&req.method==='POST'){
  const input=credentials.parse(await json());const key=await authAttempt(input.email);let user=await db.user.findUnique({where:{email:input.email}});
  if(path==='auth/register'){if(user)throw new ApiError(409,'تعذر إنشاء الحساب بهذا البريد. جرّب تسجيل الدخول.');user=await db.user.create({data:{email:input.email,passwordHash:await hash(input.password,12),role:'PARENT'}});}
  else {const valid=await compare(input.password,user?.passwordHash??'$2b$12$9vQZ9JLVYd3avAKiZT8EpeGgOvwOC8kYFVgsVSOVCX3GdVQcqGY.6');if(!user||!valid)throw new ApiError(401,'البريد أو كلمة المرور غير صحيحة.');}
  if(!user)throw new ApiError(401,'تعذر تسجيل الدخول.');await db.authThrottle.deleteMany({where:{key}});await setSession({userId:user.id,role:'PARENT'});result={ok:true};
 }
 else if(path==='auth/logout'&&req.method==='POST'){(await cookies()).delete('bloom_session');result={ok:true};}
 else if(path==='me'&&req.method==='GET'){const a=await actor();if(a.role==='STUDENT'){await requireStudent();result={role:a.role,studentId:a.studentId};}else result={role:a.role,students:await db.studentProfile.findMany({where:{parents:{some:{parentId:a.userId}}},select:{id:true,nickname:true,age:true,placementCompleted:true}})};}
 else if(path==='students'&&req.method==='POST'){const a=await requireParent();const input=onboarding.parse(await json());const count=await db.parentStudentLink.count({where:{parentId:a.userId}});if(count>=5)throw new ApiError(400,'الحد الأقصى خمسة ملفات متعلمين.');result=await db.studentProfile.create({data:{...input,parents:{create:{parentId:a.userId}}}});}
 else if(path==='enter-student'&&req.method==='POST'){const a=await requireParent();const {studentId}=z.object({studentId:sid}).parse(await json());await requireStudent(studentId);await setSession({userId:a.userId,role:'STUDENT',studentId});result={ok:true};}
 else if(path==='dashboard'&&req.method==='GET'){const {studentId}=await requireStudent(req.nextUrl.searchParams.get('studentId')??undefined);result=await dashboard(studentId);}
 else if(path==='parent-dashboard'&&req.method==='GET'){await requireParent();const {studentId}=await requireStudent(sid.parse(req.nextUrl.searchParams.get('studentId')));result=await dashboard(studentId);}
 else if(path==='sessions/start'&&req.method==='POST'){const {studentId}=await requireStudent();const input=z.object({kind:z.enum(['LESSON','PLACEMENT','REVIEW']),lessonId:sid.optional()}).parse(await json());result=await startSession(studentId,input.kind,input.lessonId);}
 else if(path==='sessions/answer'&&req.method==='POST'){const {studentId}=await requireStudent();const input=z.object({sessionId:sid,questionId:sid,answer:z.string().min(1).max(500),hintsUsed:z.number().int().min(0).max(10).default(0)}).parse(await json());result=await submitAnswer(studentId,input.sessionId,input.questionId,input.answer,input.hintsUsed);}
 else if(path==='sessions/next'&&req.method==='POST'){const {studentId}=await requireStudent();const input=z.object({sessionId:sid,supportAcknowledged:z.boolean().default(false)}).parse(await json());result=await advanceSession(studentId,input.sessionId,input.supportAcknowledged);}
 else if(path==='sessions/finish'&&req.method==='POST'){const {studentId}=await requireStudent();const {sessionId}=z.object({sessionId:sid}).parse(await json());result=await finishSession(studentId,sessionId);}
 else if(path==='sessions/abandon'&&req.method==='POST'){const {studentId}=await requireStudent();const {sessionId}=z.object({sessionId:sid}).parse(await json());result=await abandonSession(studentId,sessionId);}
 else if(path==='sessions/heartbeat'&&req.method==='POST'){const {studentId}=await requireStudent();const input=z.object({sessionId:sid,visible:z.boolean(),recentInput:z.boolean()}).parse(await json());result=await heartbeat(studentId,input.sessionId,input.visible,input.recentInput);}
 else if(path==='settings'&&req.method==='POST'){const input=z.object({studentId:sid.optional(),goalMinutes:z.number().int().min(5).max(25)}).parse(await json());const {studentId}=await requireStudent(input.studentId);result=await db.studentProfile.update({where:{id:studentId},data:{goalMinutes:input.goalMinutes}});}
 else if(path==='distractions'&&req.method==='POST'){const {category,studentId:requestedStudentId}=z.object({studentId:sid.optional(),category:z.enum(['games','phone','videos','schoolwork','tiredness','activities','motivation','other','prefer-not-to-answer'])}).parse(await json());const {studentId}=await requireStudent(requestedStudentId);const start=weekStart(new Date());result=await db.studentDistraction.upsert({where:{studentId_weekStart:{studentId,weekStart:start}},create:{studentId,category,weekStart:start,source:'SELF_REPORTED'},update:{category}});}
 else throw new ApiError(404,'الصفحة غير موجودة.');
 return NextResponse.json(result,{headers:{'Cache-Control':'no-store'}});
 }catch(error){if(error instanceof ApiError)return NextResponse.json({error:error.message},{status:error.status});if(error instanceof ZodError)return NextResponse.json({error:'تحقق من البيانات المدخلة.',fields:error.issues.map(i=>i.path.join('.'))},{status:400});console.error('api_error',{path,code:error instanceof Error?error.name:'Unknown'});return NextResponse.json({error:'تعذر إكمال الطلب. تحقق من اتصال قاعدة البيانات وحاول مجددًا.'},{status:500});}
}
export const GET=handle;export const POST=handle;
