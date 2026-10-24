import {variantCount,variantPage} from '../src/content-generation/catalog';
// JSONL stream only: no database connection and no automatic approval.
async function main(){
for(let offset=0;offset<variantCount;offset+=100){
 for(const variant of variantPage(offset,100)){
  if(!process.stdout.write(JSON.stringify(variant)+'\n'))await new Promise<void>(resolve=>process.stdout.once('drain',resolve));
 }
}

}
void main().catch(()=>{console.error("Variant export failed");process.exitCode=1;});
