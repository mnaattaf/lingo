import { FlatCompat } from '@eslint/eslintrc';
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
const config = [...compat.extends('next/core-web-vitals','next/typescript'),{ignores:['.next/**','.next-dev/**','test-results/**','playwright-report/**','node_modules/**','work/**','next-env.d.ts']}];

export default config;
