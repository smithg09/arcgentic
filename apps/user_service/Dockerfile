FROM golang:1.24-alpine AS base

RUN apk update
RUN apk add --no-cache git

WORKDIR /app

# Install and Build `core` 
FROM base AS builder

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o build/core cmd/core/main.go

# Prepare production image
FROM alpine:latest AS runner

RUN apk --no-cache add ca-certificates

RUN addgroup --system --gid 1001 user101
RUN adduser --system --uid 1001 user102

WORKDIR /app

COPY --from=builder --chown=1001:1001 /app/build/core .

USER 1001

EXPOSE 8080

ENV NODE_ENV=production

CMD ["./core"]