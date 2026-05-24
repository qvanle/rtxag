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

type ModelService interface {
	List(ctx context.Context) ([]domain.Model, error)
	Create(ctx context.Context, req CreateModelRequest) (domain.Model, error)
	Get(ctx context.Context, modelID string) (domain.Model, error)
	Update(ctx context.Context, modelID string, req UpdateModelRequest) (domain.Model, error)
	Delete(ctx context.Context, modelID string) error
}

type ProviderService interface {
	List(ctx context.Context) ([]domain.Provider, error)
	Create(ctx context.Context, req CreateProviderRequest) (domain.Provider, error)
	Update(ctx context.Context, providerID string, req UpdateProviderRequest) (domain.Provider, error)
	Toggle(ctx context.Context, providerID string) (domain.Provider, error)
	Reorder(ctx context.Context, providerIDs []string) error
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

type MCPService interface {
	ListCollections(ctx context.Context, scope domain.Scope, tenantID string) ([]domain.MCPCollection, error)
	CreateCollection(ctx context.Context, req CreateMCPCollectionRequest) (domain.MCPCollection, error)
	GetCollection(ctx context.Context, collectionID string) (domain.MCPCollection, error)
	UpdateCollection(ctx context.Context, collectionID string, req UpdateMCPCollectionRequest) (domain.MCPCollection, error)
	DeleteCollection(ctx context.Context, collectionID string) error
	ListRecords(ctx context.Context, collectionID string) ([]domain.MCPRecord, error)
	CreateRecord(ctx context.Context, collectionID string, req CreateMCPRecordRequest) (domain.MCPRecord, error)
	UpdateRecord(ctx context.Context, collectionID, recordID string, req UpdateMCPRecordRequest) (domain.MCPRecord, error)
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

type CreateModelRequest struct {
	Name     string        `json:"name"`
	Provider string        `json:"provider"`
	Version  string        `json:"version"`
	Status   domain.Status `json:"status"`
}

type UpdateModelRequest = CreateModelRequest

type CreateProviderRequest struct {
	Name        string `json:"name"`
	Environment string `json:"environment"`
	Priority    int    `json:"priority"`
	APIKey      string `json:"api_key"`
	Enabled     bool   `json:"enabled"`
}

type UpdateProviderRequest = CreateProviderRequest

type CreateRetrievalCollectionRequest struct {
	Scope            domain.Scope `json:"scope"`
	TenantID         string       `json:"tenant_id,omitempty"`
	Name             string       `json:"name"`
	EmbeddingModelID string       `json:"embedding_model_id"`
}

type UpdateRetrievalCollectionRequest struct {
	Name             *string `json:"name,omitempty"`
	EmbeddingModelID *string `json:"embedding_model_id,omitempty"`
}

type CreateRetrievalDocumentRequest struct {
	Filename string `json:"filename"`
}

type CreateMCPCollectionRequest struct {
	Scope    domain.Scope `json:"scope"`
	TenantID string       `json:"tenant_id,omitempty"`
	Name     string       `json:"name"`
}

type UpdateMCPCollectionRequest struct {
	Name *string `json:"name,omitempty"`
}

type CreateMCPRecordRequest struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

type UpdateMCPRecordRequest struct {
	Key   *string `json:"key,omitempty"`
	Value *string `json:"value,omitempty"`
}

type CreateAssistantRequest struct {
	Scope                  domain.Scope `json:"scope"`
	TenantID               string       `json:"tenant_id,omitempty"`
	Name                   string       `json:"name"`
	ModelIDs               []string     `json:"model_ids"`
	RetrievalCollectionIDs []string     `json:"retrieval_collection_ids,omitempty"`
	MCPCollectionIDs       []string     `json:"mcp_collection_ids,omitempty"`
}

type UpdateAssistantRequest struct {
	Name                   *string   `json:"name,omitempty"`
	ModelIDs               *[]string `json:"model_ids,omitempty"`
	RetrievalCollectionIDs *[]string `json:"retrieval_collection_ids,omitempty"`
	MCPCollectionIDs       *[]string `json:"mcp_collection_ids,omitempty"`
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
