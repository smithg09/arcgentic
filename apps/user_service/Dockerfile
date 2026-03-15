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

WORKDIR /root/

RUN addgroup --system --gid 1001 user101
RUN adduser --system --uid 1001 user102
USER user102

COPY --from=builder --chown=user102:user101 /app/build/core .

EXPOSE 8080

ENV NODE_ENV=production

CMD ["./core"]