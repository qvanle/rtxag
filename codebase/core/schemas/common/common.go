package common

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

type Pagination struct {
	Page     int `json:"page"`
	PageSize int `json:"page_size"`
}

type Error struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}
