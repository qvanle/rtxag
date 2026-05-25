package domain

import "time"

type Scope string

const (
	ScopeGlobal Scope = "global"
	ScopeTenant Scope = "tenant"
)

type Status string

const (
	StatusDraft      Status = "draft"
	StatusActive     Status = "active"
	StatusDeprecated Status = "deprecated"
	StatusArchived   Status = "archived"
)

type TenantStatus string

const (
	TenantStatusActive    TenantStatus = "active"
	TenantStatusSuspended TenantStatus = "suspended"
)

type Principal struct {
	UserID   string
	Roles    []string
	TenantID string
}

type DashboardGlobal struct {
	TokenConsumption string `json:"token_consumption"`
	TenantCost       string `json:"tenant_cost"`
	APIErrorRate     string `json:"api_error_rate"`
	P95Latency       string `json:"p95_latency"`
	TrafficSummary   string `json:"traffic_summary"`
}

type DashboardTenantRow struct {
	TenantID   string       `json:"tenant_id"`
	TenantName string       `json:"tenant_name"`
	Plan       string       `json:"plan"`
	Status     TenantStatus `json:"status"`
	Users      int          `json:"users"`
	TokenUsage string       `json:"token_usage"`
}

type Tenant struct {
	IDInternal string `json:"id_internal"`
	IDExternal string `json:"id_external"`
	Name       string `json:"name"`
}

type Provider struct {
	ID               string    `json:"id"`
	ProviderID       string    `json:"provider_id"`
	Name             string    `json:"name"`
	Description      string    `json:"description"`
	BaseURL          string    `json:"base_url"`
	APIKey           string    `json:"-"`
	APIKeyMasked     string    `json:"api_key_masked,omitempty"`
	Resources        string    `json:"resources,omitempty"`
	IconSVGURL       string    `json:"icon_svg_url,omitempty"`
	Enabled          bool      `json:"enabled"`
	UpdatedTimestamp int64     `json:"updated_timestamp,omitempty"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type RetrievalCollection struct {
	ID            string    `json:"id"`
	Scope         Scope     `json:"scope"`
	TenantID      *string   `json:"tenant_id"`
	Name          string    `json:"name"`
	ProviderID    string    `json:"provider_id"`
	DocumentCount int       `json:"document_count"`
	IndexStatus   string    `json:"index_status"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type RetrievalDocument struct {
	ID           string    `json:"id"`
	CollectionID string    `json:"collection_id"`
	Filename     string    `json:"filename"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
}

type ToolCollection struct {
	ID          string    `json:"id"`
	Scope       Scope     `json:"scope"`
	TenantID    *string   `json:"tenant_id"`
	Name        string    `json:"name"`
	RecordCount int       `json:"record_count"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type ToolRecord struct {
	ID           string    `json:"id"`
	CollectionID string    `json:"collection_id"`
	Key          string    `json:"key"`
	Value        string    `json:"value"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Assistant struct {
	ID                     string    `json:"id"`
	Scope                  Scope     `json:"scope"`
	TenantID               *string   `json:"tenant_id"`
	Name                   string    `json:"name"`
	Status                 Status    `json:"status"`
	ProviderID             string    `json:"provider_id"`
	RetrievalCollectionIDs []string  `json:"retrieval_collection_ids"`
	ToolCollectionIDs      []string  `json:"tools_collection_ids"`
	Version                string    `json:"version"`
	UpdatedAt              time.Time `json:"updated_at"`
}
