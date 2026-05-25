package models

import (
	"time"

	"github.com/google/uuid"
)

type Assistant struct {
	ID        uuid.UUID    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Scope     Scope        `gorm:"type:scope_type;not null;index:ix_assistants_scope_tenant,priority:1"`
	TenantID  *string      `gorm:"index:ix_assistants_scope_tenant,priority:2;index"`
	Name      string       `gorm:"not null"`
	Status    EntityStatus `gorm:"type:entity_status_type;not null;default:'draft'"`
	Version   string       `gorm:"not null"`
	CreatedBy string
	UpdatedBy string
	BaseTimestamps
}

func (Assistant) TableName() string { return "assistants" }

type AssistantModel struct {
	AssistantID uuid.UUID `gorm:"type:uuid;primaryKey"`
	ModelID     uuid.UUID `gorm:"type:uuid;primaryKey"`
	CreatedAt   time.Time `gorm:"not null;default:now()"`
}

func (AssistantModel) TableName() string { return "assistant_models" }

type AssistantRetrievalCollection struct {
	AssistantID  uuid.UUID `gorm:"type:uuid;primaryKey"`
	CollectionID uuid.UUID `gorm:"type:uuid;primaryKey"`
	CreatedAt    time.Time `gorm:"not null;default:now()"`
}

func (AssistantRetrievalCollection) TableName() string { return "assistant_retrieval_collections" }

type AssistantToolCollection struct {
	AssistantID  uuid.UUID `gorm:"type:uuid;primaryKey"`
	CollectionID uuid.UUID `gorm:"type:uuid;primaryKey"`
	CreatedAt    time.Time `gorm:"not null;default:now()"`
}

func (AssistantToolCollection) TableName() string { return "assistant_tools_collections" }
