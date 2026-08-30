import type { NextConfig } from "next";

const config: NextConfig = {
  serverExternalPackages: ["@prisma/adapter-pg"],
};

export default config;
