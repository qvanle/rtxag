package models

import (
	"time"

	"gorm.io/datatypes"

	"github.com/google/uuid"
)

type MCPCollection struct {
	ID          uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Scope       Scope     `gorm:"type:scope_type;not null;index:ix_mcp_scope_tenant,priority:1"`
	TenantID    *string   `gorm:"index:ix_mcp_scope_tenant,priority:2;index"`
	Name        string    `gorm:"not null"`
	RecordCount int       `gorm:"not null;default:0"`
	CreatedBy   string
	UpdatedBy   string
	BaseTimestamps
}

func (MCPCollection) TableName() string { return "mcp_collections" }

type MCPRecord struct {
	ID           uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	CollectionID uuid.UUID      `gorm:"type:uuid;not null;index"`
	Collection   MCPCollection  `gorm:"foreignKey:CollectionID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
	RecordKey    string         `gorm:"not null"`
	RecordValue  datatypes.JSON `gorm:"type:jsonb;not null"`
	CreatedAt    time.Time      `gorm:"not null;default:now()"`
	UpdatedAt    time.Time      `gorm:"not null;default:now()"`
}

func (MCPRecord) TableName() string { return "mcp_records" }
