# syntax=docker/dockerfile:1

FROM golang:1.23-bookworm AS builder
WORKDIR /src

RUN apt-get update && apt-get install -y \
    autoconf \
    bison \
    flex \
    g++ \
    gcc \
    libnl-route-3-dev \
    libprotobuf-dev \
    libtool \
    make \
    pkg-config \
    protobuf-compiler \
    && rm -rf /var/lib/apt/lists/*

COPY codebase/tools/go.mod ./codebase/tools/
COPY codebase/tools/dep/nsjail ./codebase/tools/dep/nsjail

WORKDIR /src/codebase/tools/dep/nsjail
RUN make clean && make

WORKDIR /src/codebase/tools
COPY codebase/tools ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/tools .
RUN cp /src/codebase/tools/dep/nsjail/nsjail /out/nsjail

FROM debian:bookworm-slim AS runtime
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    libc6 \
    libnl-route-3-200 \
    libprotobuf32 \
    libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /out/tools /app/tools
COPY --from=builder /out/nsjail /usr/local/bin/nsjail

EXPOSE 8090
ENTRYPOINT ["/app/tools"]
