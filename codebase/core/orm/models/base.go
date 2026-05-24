package models

import (
	"time"

	"gorm.io/gorm"
)

type BaseTimestamps struct {
	CreatedAt time.Time      `gorm:"not null;default:now()"`
	UpdatedAt time.Time      `gorm:"not null;default:now()"`
	DeletedAt gorm.DeletedAt `gorm:"index"`
}
