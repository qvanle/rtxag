package models

type Scope string

const (
	ScopeGlobal Scope = "global"
	ScopeTenant Scope = "tenant"
)

type EntityStatus string

const (
	EntityStatusDraft      EntityStatus = "draft"
	EntityStatusActive     EntityStatus = "active"
	EntityStatusDeprecated EntityStatus = "deprecated"
	EntityStatusArchived   EntityStatus = "archived"
)

type Environment string

const (
	EnvironmentDev     Environment = "dev"
	EnvironmentStaging Environment = "staging"
	EnvironmentProd    Environment = "prod"
)

type IndexStatus string

const (
	IndexStatusQueued   IndexStatus = "queued"
	IndexStatusIndexing IndexStatus = "indexing"
	IndexStatusIndexed  IndexStatus = "indexed"
	IndexStatusFailed   IndexStatus = "failed"
)
