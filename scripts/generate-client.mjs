// Pinned Prisma 6.19 JS generator. Avoids downloading unused Rust engines when offline.
import internals from '@prisma/internals';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const generators=await internals.getGenerators({schemaPath:'prisma/schema.prisma',skipDownload:true,registry:{'prisma-client-js':{type:'rpc',generatorPath:require.resolve('@prisma/client/generator-build/index.js'),isNode:true}}});
try{for(const generator of generators)await generator.generate();console.log('Prisma JS client generated.');}finally{for(const generator of generators)generator.stop();}
