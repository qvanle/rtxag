package models

import (
	"time"

	"github.com/google/uuid"
)

type RetrievalCollection struct {
	ID               uuid.UUID   `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Scope            Scope       `gorm:"type:scope_type;not null;index:ix_retrieval_scope_tenant,priority:1"`
	TenantID         *string     `gorm:"index:ix_retrieval_scope_tenant,priority:2;index"`
	Name             string      `gorm:"not null"`
	EmbeddingModelID uuid.UUID   `gorm:"type:uuid;not null;index"`
	EmbeddingModel   Model       `gorm:"foreignKey:EmbeddingModelID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT"`
	DocumentCount    int         `gorm:"not null;default:0"`
	IndexStatus      IndexStatus `gorm:"type:index_status_type;not null;default:'queued'"`
	CreatedBy        string
	UpdatedBy        string
	BaseTimestamps
}

func (RetrievalCollection) TableName() string { return "retrieval_collections" }

type RetrievalDocument struct {
	ID           uuid.UUID           `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	CollectionID uuid.UUID           `gorm:"type:uuid;not null;index"`
	Collection   RetrievalCollection `gorm:"foreignKey:CollectionID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
	Filename     string              `gorm:"not null"`
	ContentURI   *string
	ContentHash  *string
	SizeBytes    *int64
	MimeType     *string
	Status       IndexStatus `gorm:"type:index_status_type;not null;default:'queued'"`
	IndexedAt    *time.Time
	CreatedAt    time.Time `gorm:"not null;default:now()"`
	UpdatedAt    time.Time `gorm:"not null;default:now()"`
}

func (RetrievalDocument) TableName() string { return "retrieval_documents" }
