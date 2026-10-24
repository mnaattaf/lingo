import type { NextConfig } from 'next';

const config: NextConfig = {
 poweredByHeader: false,
 distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
 serverExternalPackages: ['@prisma/client', 'bcryptjs'],
 // Prisma loads its JS query compiler WASM dynamically; include it in Vercel Functions.
 outputFileTracingIncludes: {
  '/api/**': ['./node_modules/.prisma/client/query_compiler_bg.wasm'],
 },
 experimental: { cpus: 2 },
};
export default config;
