package main

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	if len(os.Args) > 1 && os.Args[1] == "worker" {
		runWorker()
		return
	}

	addr := getOrDefault("TOOLS_ADDR", ":8090")
	srv := NewServer(nil)

	httpServer := &http.Server{
		Addr:    addr,
		Handler: srv,
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	go func() {
		<-ctx.Done()
		_ = httpServer.Shutdown(context.Background())
	}()

	log.Printf("tools sandbox listening on %s", addr)
	if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server failed: %v", err)
	}
}

func runWorker() {
	body, err := io.ReadAll(os.Stdin)
	if err != nil {
		log.Fatalf("read request: %v", err)
	}

	var req executeRequest
	if err := json.Unmarshal(body, &req); err != nil {
		_ = json.NewEncoder(os.Stdout).Encode(envelope{
			Status: "error",
			Error: map[string]any{
				"code":    "invalid_json",
				"message": err.Error(),
			},
		})
		return
	}

	trace := executeHTTP(context.Background(), nil, req)
	_ = json.NewEncoder(os.Stdout).Encode(envelope{Status: "success", Data: trace})
}

func getOrDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
