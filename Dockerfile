# ---------------------------------------------------------------------------
# ~/blog — Next.js 16 (App Router) + Prisma 7 + Postgres
#
# Duas etapas: a de build instala tudo (inclusive as devDeps que o `prisma
# generate` e o compilador do Next precisam) e a de runtime recebe só o
# `.next/standalone`, que o Next monta com as dependências que ele mesmo
# rastreou. O resultado é uma imagem sem npm install e sem código de build.
# ---------------------------------------------------------------------------

# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# `npm run build` é `prisma generate && next build`. O generate não abre conexão
# com o banco: lê o schema e escreve o client em ./generated/prisma.
# As fontes (Bitter e JetBrains Mono) são baixadas AQUI pelo next/font e ficam
# auto-hospedadas no bundle — em runtime não há requisição a terceiros.
RUN npm run build

# ---- runtime ----
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# O servidor do standalone escuta em localhost por padrão, o que de dentro do
# container deixaria o proxy de fora.
ENV HOSTNAME=0.0.0.0

# server.js e as dependências rastreadas.
COPY --from=build --chown=node:node /app/.next/standalone ./
# O standalone não copia estes dois de propósito (a expectativa é uma CDN na
# frente). Aqui quem serve é o próprio Next, então eles têm de vir junto: sem
# .next/static o site sobe sem CSS nem fontes.
COPY --from=build --chown=node:node /app/.next/static ./.next/static

# Não rodar como root.
USER node
EXPOSE 3000
CMD ["node", "server.js"]
