import type {Question} from '../learning-engine/types';
// Versioned closed vocabulary. Generated text stays quarantined until editorial review.
const names=['Omar','Yusuf','Ali','Adam','Ibrahim','Sara','Maryam','Amina','Hana','Noor'];
const colours=['red','blue','green','yellow','white','black','brown','orange'];
const objects=['book','pencil','bag','box','cup','pen','hat','ball','ruler','notebook','shirt','coat'];
export const catalogVersion='reading-v1';
export const variantCount=names.length*colours.length*objects.length*2;
export type DraftVariant=Question&{contentStatus:'REVIEW_NEEDED';templateVersion:string};
export function variantAt(index:number):DraftVariant {
 if(!Number.isInteger(index)||index<0||index>=variantCount)throw new RangeError('Unknown variant');
 const mode=index%2;
 let slot=Math.floor(index/2);
 const object=objects[slot%objects.length];slot=Math.floor(slot/objects.length);
 const colour=colours[slot%colours.length];slot=Math.floor(slot/colours.length);
 const name=names[slot];
 const passage=`${name} has ${/^[aeiou]/.test(colour)?'an':'a'} ${colour} ${object}.`;
 const answer=mode===0?colour:object;
 const vocabulary=mode===0?colours:objects;
 const position=vocabulary.indexOf(answer);
 const options=[answer,vocabulary[(position+1)%vocabulary.length],vocabulary[(position+3)%vocabulary.length]];
 return {id:`${catalogVersion}-${index}`,templateVersion:catalogVersion,contentStatus:'REVIEW_NEEDED',skillId:'reading-short',type:'READING',prompt:`${passage} ${mode===0?'What colour is it?':'What does '+name+' have?'}`,instruction:'اقرأ الجملة وابحث عن المعلومة المطلوبة.',correctAnswer:answer,options,optionErrors:Object.fromEntries(options.slice(1).map(o=>[o,'reading'])),explanation:`ابحث في الجملة: ${passage} الإجابة هي ${answer}.`,example:passage,difficulty:1,cefr:'Pre-A1',vocabularyLevel:'beginner',estimatedTime:25,errorTags:['reading'],prerequisites:[],categories:['school','everyday-objects']};
}
// Pages keep memory bounded; IDs remain stable for historical answer references.
export function variantPage(offset=0,limit=100):DraftVariant[]{
 if(!Number.isInteger(offset)||offset<0||offset>variantCount||!Number.isInteger(limit)||limit<1||limit>500)throw new RangeError('Invalid page');
 return Array.from({length:Math.min(limit,variantCount-offset)},(_,i)=>variantAt(offset+i));
}
