# syntax=docker/dockerfile:1

FROM golang:1.23-alpine AS builder
WORKDIR /src

COPY codebase/core/go.mod codebase/core/go.sum ./codebase/core/
WORKDIR /src/codebase/core
RUN go mod download

COPY codebase/core ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/core-app .

FROM alpine:3.20 AS runtime
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app

COPY --from=builder /out/core-app /app/core-app
COPY --from=builder /src/codebase/core/orm/migrations /app/orm/migrations

USER app
EXPOSE 8080
ENTRYPOINT ["/app/core-app"]
