import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Native / engine-bearing packages must stay external to the server bundle.
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
};

export default nextConfig;
