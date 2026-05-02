FROM node:20-alpine AS builder

# Ensure pnpm is available
RUN corepack enable

WORKDIR /app

# Copy the monorepo essential configurations
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./

# Copy all projects into the build context
COPY packages ./packages
COPY apps ./apps

# Install monorepo dependencies
RUN pnpm install --frozen-lockfile

# Build the web app via turbo
RUN pnpm run build --filter=web

# Serve with Nginx
FROM nginxinc/nginx-unprivileged:alpine AS runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/templates/default.conf.template

ENV AGENT_SERVICE_URL=http://agent_service:5001
ENV USER_SERVICE_URL=http://user_service:8080
ENV NGINX_ENVSUBST_FILTER=AGENT_SERVICE_URL|USER_SERVICE_URL

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
