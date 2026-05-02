FROM node:20-alpine AS pruner
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app
COPY . .
RUN npx turbo prune web --docker

# --
FROM node:20-alpine AS installer
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app

COPY --from=pruner /app/out/json/ .

RUN pnpm install --frozen-lockfile

# --
FROM node:20-alpine AS builder
RUN corepack enable
WORKDIR /app

COPY --from=installer /app/ .

COPY --from=pruner /app/out/full/ .
RUN pnpm run build --filter=web

# ---
FROM nginxinc/nginx-unprivileged:alpine AS runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/templates/default.conf.template

ENV AGENT_SERVICE_URL=http://agent_service:5001
ENV USER_SERVICE_URL=http://user_service:8080
ENV NGINX_ENVSUBST_FILTER=AGENT_SERVICE_URL|USER_SERVICE_URL

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
