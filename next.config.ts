import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile three.js ecosystem for proper ESM handling
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  // Turbopack config (Next.js 16 default bundler)
  turbopack: {},
};

export default nextConfig;
