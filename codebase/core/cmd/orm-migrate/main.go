package main

import (
	"log"
	"os"
	"path/filepath"

	"rotexai/core/orm/db"
)

func main() {
	dsn := os.Getenv("ROTEXAI_ORM_DSN")
	if dsn == "" {
		log.Fatal("ROTEXAI_ORM_DSN is required")
	}

	conn, err := db.Open(dsn)
	if err != nil {
		log.Fatalf("open db failed: %v", err)
	}

	migrationDir := filepath.Join("migrations")
	if err := db.ApplySQLMigrations(conn, migrationDir); err != nil {
		log.Fatalf("apply migrations failed: %v", err)
	}

	log.Println("migrations applied successfully")
}
