package model

import (
	"time"

	"rotexai/core/schemas/common"
)

type Item struct {
	ID         string              `json:"id"`
	Name       string              `json:"name"`
	ProviderID string              `json:"provider_id"`
	Version    string              `json:"version"`
	Status     common.EntityStatus `json:"status"`
	UpdatedAt  time.Time           `json:"updated_at"`
}

type CreateRequest struct {
	Name       string              `json:"name"`
	ProviderID string              `json:"provider_id"`
	Version    string              `json:"version"`
	Status     common.EntityStatus `json:"status"`
}

type UpdateRequest = CreateRequest
