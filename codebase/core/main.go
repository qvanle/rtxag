package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"

	"rotexai/core/api/bootstrap"
	"rotexai/core/orm/db"
)

func main() {
	if len(os.Args) < 2 {
		runStart()
		return
	}

	switch os.Args[1] {
	case "start":
		runStart()
	case "adminapi":
		runAdminAPI()
	case "orm-migrate":
		runORMMigrate()
	case "help", "-h", "--help":
		printUsage()
	default:
		fmt.Printf("unknown command: %s\n\n", os.Args[1])
		printUsage()
		os.Exit(1)
	}
}

func runAdminAPI() {
	app, err := bootstrap.NewApp()
	if err != nil {
		log.Fatalf("bootstrap failed: %v", err)
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	go func() {
		<-ctx.Done()
		_ = app.Server.Shutdown(context.Background())
	}()

	log.Printf("admin api listening on %s", app.Server.Addr)
	if err := app.Server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server failed: %v", err)
	}
}

func runORMMigrate() {
	dsn := os.Getenv("ROTEXAI_ORM_DSN")
	if dsn == "" {
		log.Fatal("ROTEXAI_ORM_DSN is required")
	}

	runORMMigrateWithDSN(dsn)
}

func runStart() {
	dsn := os.Getenv("ROTEXAI_ORM_DSN")
	if dsn == "" {
		dsn = os.Getenv("ADMIN_API_DB_DSN")
	}
	if dsn == "" {
		log.Fatal("ROTEXAI_ORM_DSN or ADMIN_API_DB_DSN is required")
	}

	runORMMigrateWithDSN(dsn)
	runAdminAPI()
}

func runORMMigrateWithDSN(dsn string) {
	conn, err := db.Open(dsn)
	if err != nil {
		log.Fatalf("open db failed: %v", err)
	}

	migrationDir := filepath.Join("orm", "migrations")
	if err := db.ApplySQLMigrations(conn, migrationDir); err != nil {
		log.Fatalf("apply migrations failed: %v", err)
	}

	log.Println("migrations applied successfully")
}

func printUsage() {
	fmt.Println("Usage: go run . <command>")
	fmt.Println("")
	fmt.Println("Commands:")
	fmt.Println("  start         Run migrations then start admin API (default)")
	fmt.Println("  adminapi      Run admin API server")
	fmt.Println("  orm-migrate   Apply ORM SQL migrations")
}
