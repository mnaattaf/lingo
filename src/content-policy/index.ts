export const forbiddenCategories=['pork','alcohol','recreational-drugs','gambling','sexual-content','pornography','age-inappropriate-romance','policy-conflicting-relationship-scenarios','hate','graphic-violence'] as const;
export type ContentSubmission={origin:'human'|'ai';categories:string[];ageSafe:boolean|null;educationallyValid:boolean|null;skillAligned:boolean|null;humanReviewed:boolean;reviewer?:string;text:string;assetReviewed?:boolean;trustedCoreReview?:boolean};
export function checkContent(c:ContentSubmission){
 const violations=c.categories.filter(x=>(forbiddenCategories as readonly string[]).includes(x));
 if(violations.length||c.ageSafe===false||c.educationallyValid===false||c.skillAligned===false)return {status:'REJECTED' as const,reasons:violations.length?violations:['validation-failed']};
 // Category attestations alone cannot approve text or visual assets; a human review is required in v1.
 if(!c.categories.length||c.ageSafe!==true||c.educationallyValid!==true||c.skillAligned!==true||(!c.humanReviewed&&!c.trustedCoreReview)||!c.reviewer||c.assetReviewed===false)return {status:'REVIEW_NEEDED' as const,reasons:['human-review-required']};
 return {status:'APPROVED' as const,reasons:[]};
}
