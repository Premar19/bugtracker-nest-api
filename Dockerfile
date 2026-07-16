### deps: install dependencies and generate the Prisma client
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

### build: compile TypeScript
FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/generated ./generated
COPY . .
RUN npm run build

### production: minimal runtime image
FROM node:24-alpine AS production
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
