# syntax=docker/dockerfile:1
# Production image: multi-stage build of the Next.js standalone output, run as a non-root user.
#   docker build -t acme-frontend ./frontend
#   docker run -p 3000:3000 -e API_URL=https://api.example.com acme-frontend
# API_URL is read at runtime on the server only, so one image works for every environment.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# The build never calls the API (every data-dependent part is dynamic), so no API_URL is needed here.
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

# output: 'standalone' traces only the files the server needs (incl. a minimal node_modules);
# static assets are not part of it and are copied next to it.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000
CMD ["node", "server.js"]
