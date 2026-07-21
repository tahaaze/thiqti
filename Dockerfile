FROM node:22-alpine AS base
WORKDIR /app

# Copy web app dependencies only
COPY apps/web/package.json ./
RUN npm install

# Copy web app source and build
COPY apps/web/ ./
RUN npm run build

# Production runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
