import {createHash} from 'node:crypto';
// Stable within a session, so retries do not move choices under the learner's finger.
// Each occurrence has its own identity, including repeated word-order tokens.
export function orderedOptions(options:string[],sessionId:string,questionId:string){
 return options.map((value,index)=>({value,index,key:createHash('sha256').update(`${sessionId}:${questionId}:${index}`).digest('hex')})).sort((a,b)=>a.key.localeCompare(b.key)||a.index-b.index).map(item=>item.value);
}
