package application

import (
	"context"

	"rotexai/core/api/internal/domain"
)

type Pagination struct {
	Page     int `json:"page"`
	PageSize int `json:"page_size"`
}

type DashboardService interface {
	GetGlobal(ctx context.Context) (domain.DashboardGlobal, error)
	ListTenants(ctx context.Context, pagination Pagination, plan, status string) ([]domain.DashboardTenantRow, error)
}

type TenantService interface {
	List(ctx context.Context, pagination Pagination) ([]domain.Tenant, error)
	Create(ctx context.Context, req CreateTenantRequest) (domain.Tenant, error)
	Update(ctx context.Context, idInternal string, req UpdateTenantRequest) (domain.Tenant, error)
	Delete(ctx context.Context, idInternal string) error
}

type ProviderService interface {
	List(ctx context.Context) ([]domain.Provider, error)
	GetByProviderID(ctx context.Context, providerID string) (domain.Provider, error)
	Create(ctx context.Context, req CreateProviderRequest) (domain.Provider, error)
	Update(ctx context.Context, providerID string, req UpdateProviderRequest) (domain.Provider, error)
	Delete(ctx context.Context, providerID string) error
}

type RetrievalService interface {
	ListCollections(ctx context.Context, scope domain.Scope, tenantID string) ([]domain.RetrievalCollection, error)
	CreateCollection(ctx context.Context, req CreateRetrievalCollectionRequest) (domain.RetrievalCollection, error)
	GetCollection(ctx context.Context, collectionID string) (domain.RetrievalCollection, error)
	UpdateCollection(ctx context.Context, collectionID string, req UpdateRetrievalCollectionRequest) (domain.RetrievalCollection, error)
	DeleteCollection(ctx context.Context, collectionID string) error
	ListDocuments(ctx context.Context, collectionID string) ([]domain.RetrievalDocument, error)
	CreateDocument(ctx context.Context, collectionID string, req CreateRetrievalDocumentRequest) (domain.RetrievalDocument, error)
	DeleteDocument(ctx context.Context, collectionID, documentID string) error
	ReindexCollection(ctx context.Context, collectionID string) error
}

type ToolsService interface {
	ListCollections(ctx context.Context, scope domain.Scope, tenantID string) ([]domain.ToolCollection, error)
	CreateCollection(ctx context.Context, req CreateToolCollectionRequest) (domain.ToolCollection, error)
	GetCollection(ctx context.Context, collectionID string) (domain.ToolCollection, error)
	UpdateCollection(ctx context.Context, collectionID string, req UpdateToolCollectionRequest) (domain.ToolCollection, error)
	DeleteCollection(ctx context.Context, collectionID string) error
	ListRecords(ctx context.Context, collectionID string) ([]domain.ToolRecord, error)
	CreateRecord(ctx context.Context, collectionID string, req CreateToolRecordRequest) (domain.ToolRecord, error)
	UpdateRecord(ctx context.Context, collectionID, recordID string, req UpdateToolRecordRequest) (domain.ToolRecord, error)
	DeleteRecord(ctx context.Context, collectionID, recordID string) error
}

type AssistantService interface {
	List(ctx context.Context, scope domain.Scope, tenantID string) ([]domain.Assistant, error)
	Create(ctx context.Context, req CreateAssistantRequest) (domain.Assistant, error)
	Get(ctx context.Context, assistantID string) (domain.Assistant, error)
	Update(ctx context.Context, assistantID string, req UpdateAssistantRequest) (domain.Assistant, error)
	Delete(ctx context.Context, assistantID string) error
	Activate(ctx context.Context, assistantID string) error
	Clone(ctx context.Context, assistantID string, req CloneAssistantRequest) (domain.Assistant, error)
}

type CreateProviderRequest struct {
	ProviderID   string `json:"provider_id"`
	Name         string `json:"name"`
	Description  string `json:"description"`
	BaseURL      string `json:"base_url"`
	APIKey       string `json:"api_key,omitempty"`
	Resources    string `json:"resources,omitempty"`
	IconSVGURL   string `json:"icon_svg_url,omitempty"`
	Enabled      bool   `json:"enabled"`
	UpdatedStamp int64  `json:"updated_timestamp,omitempty"`
}

type UpdateProviderRequest = CreateProviderRequest

type CreateRetrievalCollectionRequest struct {
	Scope      domain.Scope `json:"scope"`
	TenantID   string       `json:"tenant_id,omitempty"`
	Name       string       `json:"name"`
	ProviderID string       `json:"provider_id"`
}

type UpdateRetrievalCollectionRequest struct {
	Name       *string `json:"name,omitempty"`
	ProviderID *string `json:"provider_id,omitempty"`
}

type CreateRetrievalDocumentRequest struct {
	Filename string `json:"filename"`
}

type CreateToolCollectionRequest struct {
	Scope    domain.Scope `json:"scope"`
	TenantID string       `json:"tenant_id,omitempty"`
	Name     string       `json:"name"`
}

type UpdateToolCollectionRequest struct {
	Name *string `json:"name,omitempty"`
}

type CreateToolRecordRequest struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

type UpdateToolRecordRequest struct {
	Key   *string `json:"key,omitempty"`
	Value *string `json:"value,omitempty"`
}

type CreateAssistantRequest struct {
	Scope                  domain.Scope `json:"scope"`
	TenantID               string       `json:"tenant_id,omitempty"`
	Name                   string       `json:"name"`
	ProviderID             string       `json:"provider_id"`
	RetrievalCollectionIDs []string     `json:"retrieval_collection_ids,omitempty"`
	ToolCollectionIDs      []string     `json:"tools_collection_ids,omitempty"`
}

type UpdateAssistantRequest struct {
	Name                   *string   `json:"name,omitempty"`
	ProviderID             *string   `json:"provider_id,omitempty"`
	RetrievalCollectionIDs *[]string `json:"retrieval_collection_ids,omitempty"`
	ToolCollectionIDs      *[]string `json:"tools_collection_ids,omitempty"`
}

type CloneAssistantRequest struct {
	TargetScope    domain.Scope `json:"target_scope"`
	TargetTenantID string       `json:"target_tenant_id,omitempty"`
}

type CreateTenantRequest struct {
	IDInternal string `json:"id_internal"`
	IDExternal string `json:"id_external"`
	Name       string `json:"name"`
}

type UpdateTenantRequest struct {
	IDExternal *string `json:"id_external,omitempty"`
	Name       *string `json:"name,omitempty"`
}
