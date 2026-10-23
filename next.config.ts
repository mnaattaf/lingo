import type { NextConfig } from 'next';
const config: NextConfig = { poweredByHeader:false, distDir:process.env.NODE_ENV==='development'?'.next-dev':'.next', serverExternalPackages:['@prisma/client','bcryptjs'], experimental:{cpus:2} };
export default config;
