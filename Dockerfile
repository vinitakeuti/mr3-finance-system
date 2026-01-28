# =====================
# 1) Imagem de build
# =====================
FROM node:20-alpine AS builder

WORKDIR /app

# Dependências nativas necessárias para Prisma
RUN apk add --no-cache openssl

# Copia package.json / package-lock (ou pnpm/yarn se usar)
COPY package*.json ./
COPY prisma ./prisma

# Instala dependências
# (use npm ci se o package-lock.json estiver sempre sincronizado com o package.json)
RUN npm install

# Copia o restante do código
COPY . .

# Gera o client do Prisma
RUN npx prisma generate

# Build de produção do Next
RUN npm run build

# =====================
# 2) Imagem de runtime
# =====================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Dependências nativas para Prisma
RUN apk add --no-cache openssl

# Copia apenas o necessário do estágio de build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma

# Porta padrão do Next
ENV PORT=3000

# Aplica migrations em produção e inicia o servidor
CMD sh -c "npx prisma migrate deploy && npm run start"