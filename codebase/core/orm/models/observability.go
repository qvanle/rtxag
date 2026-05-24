package models

import (
	"time"

	"gorm.io/datatypes"

	"github.com/google/uuid"
)

type APIRequestMetricsHourly struct {
	BucketStart      time.Time `gorm:"not null;primaryKey"`
	TenantID         *string   `gorm:"primaryKey"`
	Endpoint         string    `gorm:"not null;primaryKey"`
	Method           string    `gorm:"not null;primaryKey"`
	RequestCount     int64     `gorm:"not null;default:0"`
	TokenConsumption int64     `gorm:"not null;default:0"`
	CostCents        int64     `gorm:"not null;default:0"`
	ErrorCount       int64     `gorm:"not null;default:0"`
	P95LatencyMS     int       `gorm:"not null;default:0"`
}

func (APIRequestMetricsHourly) TableName() string { return "api_request_metrics_hourly" }

type AuditEvent struct {
	ID             uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	EventType      string         `gorm:"not null;index"`
	ActorID        string         `gorm:"not null;index:ix_audit_events_actor,priority:1"`
	ActorRoles     datatypes.JSON `gorm:"type:jsonb;not null;default:'[]'"`
	TenantID       *string        `gorm:"index"`
	TargetType     string         `gorm:"not null;index:ix_audit_events_target,priority:1"`
	TargetID       string         `gorm:"not null;index:ix_audit_events_target,priority:2"`
	BeforeSnapshot datatypes.JSON `gorm:"type:jsonb"`
	AfterSnapshot  datatypes.JSON `gorm:"type:jsonb"`
	IPAddress      *string        `gorm:"type:inet"`
	RequestID      *string
	CreatedAt      time.Time `gorm:"not null;default:now();index:ix_audit_events_created_at,sort:desc;index:ix_audit_events_actor,priority:2,sort:desc;index:ix_audit_events_target,priority:3,sort:desc"`
}

func (AuditEvent) TableName() string { return "audit_events" }
