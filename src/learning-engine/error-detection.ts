import type {Question} from './types';
export const errorTaxonomy=[
 {id:'grammar',title:'القواعد',parentId:null}, {id:'verb',title:'الأفعال',parentId:'grammar'},
 {id:'present-simple',title:'المضارع البسيط',parentId:'verb'}, {id:'third-person',title:'المفرد الغائب',parentId:'present-simple'},
 {id:'missing-s',title:'إضافة s مع المفرد الغائب',parentId:'third-person'},
 {id:'be-agreement',title:'اختيار am / is / are',parentId:'grammar'},
 {id:'negative',title:'النفي في المضارع',parentId:'present-simple'},
 {id:'vocabulary',title:'معنى الكلمة',parentId:null}, {id:'spelling',title:'تهجئة',parentId:null},
 {id:'word-order',title:'ترتيب الكلمات',parentId:null}, {id:'reading',title:'فهم المقروء',parentId:null},
 {id:'listening',title:'الاستماع',parentId:null}, {id:'pronunciation',title:'النطق',parentId:null},
 {id:'repeated',title:'نمط خطأ متكرر محتمل',parentId:null}, {id:'possible-careless',title:'مؤشر خطأ عابر محتمل',parentId:null},
];
export const normalize=(s:string)=>s.trim().toLowerCase().replace(/[.!?،؟]/g,'').replace(/\s+/g,' ');
export function diagnose(q:Question,answer:string,previousSameError=0){
 if(normalize(answer)===normalize(q.correctAnswer))return [];
 const tag=q.optionErrors[answer]??(q.type==='WORD_ORDER'?'word-order':q.errorTags[0]);
 if(!tag)return [];
 return [{errorTypeId:tag,probability:q.optionErrors[answer]?.9:.55,evidence:'question-skill-aligned-rule'},...(previousSameError>=2?[{errorTypeId:'repeated',probability:.7,evidence:'three-or-more-related-errors'}]:[])];
}
export function evaluate(q:Question,answer:string){
 if(['SPEAKING','WRITING','MATCHING','LISTENING','DICTATION'].includes(q.type))throw new Error('Question type requires a dedicated evaluator');
 const correct=normalize(answer)===normalize(q.correctAnswer);
 return {correct,correctAnswer:q.correctAnswer,explanation:q.explanation,example:q.example,possibleCause:correct?null:diagnose(q,answer)[0]?.errorTypeId??null,message:correct?'أحسنت! خطوة جديدة في رحلتك.':'محاولة طيبة، لنتعلمها معًا.',errors:diagnose(q,answer)};
}
