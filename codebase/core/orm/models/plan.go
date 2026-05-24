package models

import (
	"time"

	"github.com/google/uuid"
)

type Plan struct {
	ID                     uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Code                   string    `gorm:"not null;uniqueIndex"`
	Name                   string    `gorm:"not null"`
	MaxUsers               int       `gorm:"not null;default:0"`
	MaxAgents              int       `gorm:"not null;default:0"`
	RateLimitRPM           int       `gorm:"not null;default:0"`
	RateLimitTPM           int       `gorm:"not null;default:0"`
	StorageBytes           int64     `gorm:"not null;default:0"`
	MonthlyTokenBudget     int64     `gorm:"not null;default:0"`
	MonthlyCostBudgetCents int64     `gorm:"not null;default:0"`
	CreatedAt              time.Time `gorm:"not null;default:now()"`
	UpdatedAt              time.Time `gorm:"not null;default:now()"`
}

func (Plan) TableName() string { return "plans" }
