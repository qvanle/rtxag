package models

type Tenant struct {
	IDInternal string `gorm:"column:id_internal;not null;primaryKey"`
	IDExternal string `gorm:"column:id_external;not null;uniqueIndex"`
	Name       string `gorm:"column:name;not null"`
}

func (Tenant) TableName() string { return "tenants" }
