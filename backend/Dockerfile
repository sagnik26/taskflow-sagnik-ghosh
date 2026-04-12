# --- deps ---
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

# --- runtime ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nodejs

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY node-pg-migrate.json ./
COPY migrations ./migrations
COPY server.js ./
COPY scripts/entrypoint.sh ./scripts/entrypoint.sh

RUN chmod +x scripts/entrypoint.sh \
  && chown -R nodejs:nodejs /app

USER nodejs
EXPOSE 4000
ENTRYPOINT ["./scripts/entrypoint.sh"]
