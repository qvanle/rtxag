package models

import "github.com/google/uuid"

type Provider struct {
	ID           uuid.UUID   `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Name         string      `gorm:"not null;uniqueIndex:ux_providers_name_env"`
	Environment  Environment `gorm:"type:environment_type;not null;uniqueIndex:ux_providers_name_env;uniqueIndex:ux_providers_env_priority"`
	Priority     int         `gorm:"not null;uniqueIndex:ux_providers_env_priority"`
	APIKeyMasked string      `gorm:"not null"`
	Enabled      bool        `gorm:"not null;default:true"`
	BaseTimestamps
}

func (Provider) TableName() string { return "providers" }
