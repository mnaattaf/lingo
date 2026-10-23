import {defineConfig} from 'vitest/config';
export default defineConfig({test:{include:process.env.RUN_DB_TESTS?['src/tests/integration.test.ts']:['src/tests/engine.test.ts','src/tests/authorization.test.ts'],testTimeout:20000}});
