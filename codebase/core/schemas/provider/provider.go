package provider

import "time"

type Item struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Environment  string    `json:"environment"`
	Priority     int       `json:"priority"`
	APIKeyMasked string    `json:"api_key_masked"`
	Enabled      bool      `json:"enabled"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type CreateRequest struct {
	Name        string `json:"name"`
	Environment string `json:"environment"`
	Priority    int    `json:"priority"`
	APIKey      string `json:"api_key"`
	Enabled     bool   `json:"enabled"`
}

type UpdateRequest = CreateRequest

type ReorderRequest struct {
	ProviderIDs []string `json:"provider_ids"`
}
