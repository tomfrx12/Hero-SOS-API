FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# Garde la CLI Prisma pour lancer les migrations au déploiement
FROM build AS migrate

CMD ["npx", "prisma", "migrate", "deploy", "--config", "prisma7.config.ts"]

FROM build AS prune

RUN npm prune --omit=dev

FROM node:20-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

COPY --from=prune /app/package*.json ./
COPY --from=prune /app/node_modules ./node_modules
COPY --from=prune /app/dist ./dist

RUN mkdir uploads && chown node:node uploads

USER node

CMD ["node", "dist/index.js"]
