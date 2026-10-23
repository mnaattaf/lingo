import internals from '@prisma/internals';import {readFileSync} from 'node:fs';
const {datamodel}=await internals.getDMMF({datamodel:readFileSync('prisma/schema.prisma','utf8')});console.log(`Prisma WASM schema validation passed: ${datamodel.models.length} models.`);
