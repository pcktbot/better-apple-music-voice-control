FROM oven/bun:1-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile --production

FROM base AS runner
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
RUN mkdir -p /app/data /app/secrets
EXPOSE 7777
CMD ["bun", "run", "src/index.ts"]
