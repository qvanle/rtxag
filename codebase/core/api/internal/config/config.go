package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

type Config struct {
	HTTP   HTTPConfig
	DB     DBConfig
	LLMHub LLMHubConfig
}

type HTTPConfig struct {
	Addr         string
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
	IdleTimeout  time.Duration
}

type DBConfig struct {
	DSN string
}

type LLMHubConfig struct {
	Origin string
}

func Load() (Config, error) {
	cfg := Config{
		HTTP: HTTPConfig{
			Addr:         getOrDefault("ADMIN_API_ADDR", ":8080"),
			ReadTimeout:  getDurationOrDefault("ADMIN_API_READ_TIMEOUT_SEC", 15),
			WriteTimeout: getDurationOrDefault("ADMIN_API_WRITE_TIMEOUT_SEC", 15),
			IdleTimeout:  getDurationOrDefault("ADMIN_API_IDLE_TIMEOUT_SEC", 60),
		},
		DB: DBConfig{
			DSN: os.Getenv("ADMIN_API_DB_DSN"),
		},
		LLMHub: LLMHubConfig{
			Origin: getOrDefault("LLMHUB_ORIGIN", "http://llmhub:8000"),
		},
	}

	if cfg.DB.DSN == "" {
		return Config{}, fmt.Errorf("ADMIN_API_DB_DSN is required")
	}

	return cfg, nil
}

func getOrDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func getDurationOrDefault(key string, fallbackSec int) time.Duration {
	raw := os.Getenv(key)
	if raw == "" {
		return time.Duration(fallbackSec) * time.Second
	}
	parsed, err := strconv.Atoi(raw)
	if err != nil {
		return time.Duration(fallbackSec) * time.Second
	}
	return time.Duration(parsed) * time.Second
}
