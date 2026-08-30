import type { NextConfig } from "next";

const config: NextConfig = {
  serverExternalPackages: ["@prisma/adapter-pg"],
  // Build para container: o Next escreve em .next/standalone só os arquivos que
  // ele rastreou como necessários, com um server.js próprio. Sem isso a imagem
  // de runtime teria de carregar o node_modules inteiro.
  output: "standalone",
};

export default config;
