import {checkContent,type ContentSubmission} from '../content-policy';
export interface AIProvider {generatePractice(input:{skillId:string;age:number;locale:string}):Promise<{text:string;categories:string[]}>;explain(input:{skillId:string;mistake:string}):Promise<string>;}
export async function generateReviewedPractice(provider:AIProvider,input:{skillId:string;age:number;locale:string}){
 const generated=await provider.generatePractice(input);
 const review:ContentSubmission={...generated,origin:'ai',ageSafe:null,educationallyValid:null,skillAligned:null,humanReviewed:false};
 return {content:generated,review:checkContent(review)}; // Quarantined; never returned to the child by the lesson API.
}
export class DisabledAIProvider implements AIProvider {
 async generatePractice():Promise<{text:string;categories:string[]}>{throw new Error('AI practice is not enabled. Use approved curriculum.');}
 async explain():Promise<string>{throw new Error('AI tutor is not enabled.');}
}
