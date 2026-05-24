package models

import "github.com/google/uuid"

type Model struct {
	ID               uuid.UUID    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Name             string       `gorm:"not null;uniqueIndex:ux_models_name_version"`
	ProviderID       uuid.UUID    `gorm:"type:uuid;not null;index"`
	Provider         Provider     `gorm:"foreignKey:ProviderID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT"`
	Version          string       `gorm:"not null;uniqueIndex:ux_models_name_version"`
	Status           EntityStatus `gorm:"type:entity_status_type;not null;default:'draft'"`
	IsSystemRequired bool         `gorm:"not null;default:false"`
	CreatedBy        string
	UpdatedBy        string
	BaseTimestamps
}

func (Model) TableName() string { return "models" }
