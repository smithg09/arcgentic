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
FROM nginx:alpine AS runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
