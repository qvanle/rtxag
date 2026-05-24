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

type Model struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Provider  string    `json:"provider"`
	Version   string    `json:"version"`
	Status    Status    `json:"status"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Provider struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Environment  string    `json:"environment"`
	Priority     int       `json:"priority"`
	APIKeyMasked string    `json:"api_key_masked"`
	Enabled      bool      `json:"enabled"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type RetrievalCollection struct {
	ID               string    `json:"id"`
	Scope            Scope     `json:"scope"`
	TenantID         *string   `json:"tenant_id"`
	Name             string    `json:"name"`
	EmbeddingModelID string    `json:"embedding_model_id"`
	DocumentCount    int       `json:"document_count"`
	IndexStatus      string    `json:"index_status"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type RetrievalDocument struct {
	ID           string    `json:"id"`
	CollectionID string    `json:"collection_id"`
	Filename     string    `json:"filename"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
}

type MCPCollection struct {
	ID          string    `json:"id"`
	Scope       Scope     `json:"scope"`
	TenantID    *string   `json:"tenant_id"`
	Name        string    `json:"name"`
	RecordCount int       `json:"record_count"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type MCPRecord struct {
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
	ModelIDs               []string  `json:"model_ids"`
	RetrievalCollectionIDs []string  `json:"retrieval_collection_ids"`
	MCPCollectionIDs       []string  `json:"mcp_collection_ids"`
	Version                string    `json:"version"`
	UpdatedAt              time.Time `json:"updated_at"`
}
