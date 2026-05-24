package application

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"

	"rotexai/core/api/internal/domain"
)

type InMemoryServices struct {
	Dashboard DashboardService
	Tenant    TenantService
	Provider  ProviderService
	Retrieval RetrievalService
	MCP       MCPService
	Assistant AssistantService
}

func NewInMemoryServices() *InMemoryServices {
	state := &memoryState{}
	return &InMemoryServices{
		Dashboard: &dashboardMemoryService{state: state},
		Tenant:    &tenantMemoryService{state: state},
		Provider:  &providerMemoryService{state: state},
		Retrieval: &retrievalMemoryService{state: state},
		MCP:       &mcpMemoryService{state: state},
		Assistant: &assistantMemoryService{state: state},
	}
}

type memoryState struct {
	mu          sync.RWMutex
	providers   map[string]domain.Provider
	tenants     map[string]domain.Tenant
	retrievals  map[string]domain.RetrievalCollection
	documents   map[string]domain.RetrievalDocument
	mcpCols     map[string]domain.MCPCollection
	mcpRecords  map[string]domain.MCPRecord
	assistants  map[string]domain.Assistant
	initialized bool
}

func (s *memoryState) init() {
	if s.initialized {
		return
	}
	s.providers = map[string]domain.Provider{}
	s.tenants = map[string]domain.Tenant{}
	s.retrievals = map[string]domain.RetrievalCollection{}
	s.documents = map[string]domain.RetrievalDocument{}
	s.mcpCols = map[string]domain.MCPCollection{}
	s.mcpRecords = map[string]domain.MCPRecord{}
	s.assistants = map[string]domain.Assistant{}
	s.initialized = true
}

type dashboardMemoryService struct{ state *memoryState }

func (s *dashboardMemoryService) GetGlobal(context.Context) (domain.DashboardGlobal, error) {
	return domain.DashboardGlobal{
		TokenConsumption: "0",
		TenantCost:       "0",
		APIErrorRate:     "0%",
		P95Latency:       "0ms",
		TrafficSummary:   "no data",
	}, nil
}

func (s *dashboardMemoryService) ListTenants(_ context.Context, pagination Pagination, plan, status string) ([]domain.DashboardTenantRow, error) {
	s.state.mu.RLock()
	defer s.state.mu.RUnlock()
	s.state.init()

	normalizedPlan := strings.TrimSpace(strings.ToLower(plan))
	normalizedStatus := strings.TrimSpace(strings.ToLower(status))

	rows := make([]domain.DashboardTenantRow, 0, len(s.state.tenants))
	for _, tenant := range s.state.tenants {
		row := domain.DashboardTenantRow{
			TenantID:   tenant.IDInternal,
			TenantName: tenant.Name,
			Plan:       "free",
			Status:     domain.TenantStatusActive,
			Users:      0,
			TokenUsage: "0",
		}
		if normalizedPlan != "" && strings.ToLower(row.Plan) != normalizedPlan {
			continue
		}
		if normalizedStatus != "" && strings.ToLower(string(row.Status)) != normalizedStatus {
			continue
		}
		rows = append(rows, row)
	}

	if pagination.Page <= 0 || pagination.PageSize <= 0 {
		return rows, nil
	}
	start := (pagination.Page - 1) * pagination.PageSize
	if start >= len(rows) {
		return []domain.DashboardTenantRow{}, nil
	}
	end := start + pagination.PageSize
	if end > len(rows) {
		end = len(rows)
	}
	return rows[start:end], nil
}

type tenantMemoryService struct{ state *memoryState }

func (s *tenantMemoryService) List(_ context.Context, pagination Pagination) ([]domain.Tenant, error) {
	s.state.mu.RLock()
	defer s.state.mu.RUnlock()
	rows := make([]domain.Tenant, 0, len(s.state.tenants))
	for _, t := range s.state.tenants {
		rows = append(rows, t)
	}
	// Keep behavior simple for now; pagination params are accepted for API compatibility.
	_ = pagination
	return rows, nil
}

func (s *tenantMemoryService) Create(_ context.Context, req CreateTenantRequest) (domain.Tenant, error) {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	s.state.init()
	idInternal := strings.TrimSpace(req.IDInternal)
	idExternal := strings.TrimSpace(req.IDExternal)
	name := strings.TrimSpace(req.Name)
	if idInternal == "" || idExternal == "" || name == "" {
		return domain.Tenant{}, fmt.Errorf("id_internal, id_external, name are required")
	}
	if _, exists := s.state.tenants[idInternal]; exists {
		return domain.Tenant{}, fmt.Errorf("tenant already exists")
	}
	for _, existing := range s.state.tenants {
		if existing.IDExternal == idExternal {
			return domain.Tenant{}, fmt.Errorf("id_external already exists")
		}
	}
	t := domain.Tenant{IDInternal: idInternal, IDExternal: idExternal, Name: name}
	s.state.tenants[t.IDInternal] = t
	return t, nil
}

func (s *tenantMemoryService) Update(_ context.Context, idInternal string, req UpdateTenantRequest) (domain.Tenant, error) {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	t, ok := s.state.tenants[idInternal]
	if !ok {
		return domain.Tenant{}, fmt.Errorf("tenant not found")
	}
	if req.IDExternal != nil {
		nextExternal := strings.TrimSpace(*req.IDExternal)
		if nextExternal == "" {
			return domain.Tenant{}, fmt.Errorf("id_external cannot be empty")
		}
		for id, existing := range s.state.tenants {
			if id != idInternal && existing.IDExternal == nextExternal {
				return domain.Tenant{}, fmt.Errorf("id_external already exists")
			}
		}
		t.IDExternal = nextExternal
	}
	if req.Name != nil {
		nextName := strings.TrimSpace(*req.Name)
		if nextName == "" {
			return domain.Tenant{}, fmt.Errorf("name cannot be empty")
		}
		t.Name = nextName
	}
	s.state.tenants[idInternal] = t
	return t, nil
}

func (s *tenantMemoryService) Delete(_ context.Context, idInternal string) error {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	delete(s.state.tenants, idInternal)
	return nil
}

type providerMemoryService struct{ state *memoryState }

func maskAPIKey(raw string) string {
	v := strings.TrimSpace(raw)
	if v == "" {
		return ""
	}
	if len(v) <= 8 {
		return "***"
	}
	return v[:4] + "..." + v[len(v)-4:]
}

func (s *providerMemoryService) List(context.Context) ([]domain.Provider, error) {
	s.state.mu.RLock()
	defer s.state.mu.RUnlock()
	rows := make([]domain.Provider, 0, len(s.state.providers))
	for _, p := range s.state.providers {
		rows = append(rows, p)
	}
	return rows, nil
}

func (s *providerMemoryService) GetByProviderID(_ context.Context, providerID string) (domain.Provider, error) {
	s.state.mu.RLock()
	defer s.state.mu.RUnlock()
	for _, p := range s.state.providers {
		if p.ProviderID == strings.TrimSpace(providerID) {
			return p, nil
		}
	}
	return domain.Provider{}, fmt.Errorf("provider not found")
}
func (s *providerMemoryService) Create(_ context.Context, req CreateProviderRequest) (domain.Provider, error) {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	s.state.init()
	p := domain.Provider{
		ID:               uuid.NewString(),
		ProviderID:       strings.TrimSpace(req.ProviderID),
		Name:             strings.TrimSpace(req.Name),
		Description:      strings.TrimSpace(req.Description),
		BaseURL:          strings.TrimSpace(req.BaseURL),
		APIKey:           strings.TrimSpace(req.APIKey),
		APIKeyMasked:     maskAPIKey(req.APIKey),
		Resources:        req.Resources,
		IconSVGURL:       strings.TrimSpace(req.IconSVGURL),
		Enabled:          req.Enabled,
		UpdatedTimestamp: req.UpdatedStamp,
		UpdatedAt:        time.Now().UTC(),
	}
	s.state.providers[p.ID] = p
	return p, nil
}
func (s *providerMemoryService) Update(_ context.Context, providerID string, req UpdateProviderRequest) (domain.Provider, error) {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	p, ok := s.state.providers[providerID]
	if !ok {
		return domain.Provider{}, fmt.Errorf("provider not found")
	}
	p.ProviderID = strings.TrimSpace(req.ProviderID)
	p.Name = strings.TrimSpace(req.Name)
	p.Description = strings.TrimSpace(req.Description)
	p.BaseURL = strings.TrimSpace(req.BaseURL)
	if strings.TrimSpace(req.APIKey) != "" {
		p.APIKey = strings.TrimSpace(req.APIKey)
		p.APIKeyMasked = maskAPIKey(req.APIKey)
	}
	p.Resources = req.Resources
	p.IconSVGURL = strings.TrimSpace(req.IconSVGURL)
	p.Enabled = req.Enabled
	p.UpdatedTimestamp = req.UpdatedStamp
	p.UpdatedAt = time.Now().UTC()
	s.state.providers[providerID] = p
	return p, nil
}
func (s *providerMemoryService) Delete(_ context.Context, providerID string) error {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	if _, ok := s.state.providers[providerID]; !ok {
		return fmt.Errorf("provider not found")
	}
	delete(s.state.providers, providerID)
	return nil
}

type retrievalMemoryService struct{ state *memoryState }

func (s *retrievalMemoryService) ListCollections(_ context.Context, scope domain.Scope, tenantID string) ([]domain.RetrievalCollection, error) {
	s.state.mu.RLock()
	defer s.state.mu.RUnlock()
	rows := []domain.RetrievalCollection{}
	for _, c := range s.state.retrievals {
		if c.Scope != scope {
			continue
		}
		if scope == domain.ScopeTenant && (c.TenantID == nil || *c.TenantID != tenantID) {
			continue
		}
		rows = append(rows, c)
	}
	return rows, nil
}
func (s *retrievalMemoryService) CreateCollection(_ context.Context, req CreateRetrievalCollectionRequest) (domain.RetrievalCollection, error) {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	s.state.init()
	col := domain.RetrievalCollection{ID: uuid.NewString(), Scope: req.Scope, Name: req.Name, ProviderID: req.ProviderID, IndexStatus: "queued", UpdatedAt: time.Now().UTC()}
	if req.Scope == domain.ScopeTenant {
		col.TenantID = &req.TenantID
	}
	s.state.retrievals[col.ID] = col
	return col, nil
}
func (s *retrievalMemoryService) GetCollection(_ context.Context, collectionID string) (domain.RetrievalCollection, error) {
	s.state.mu.RLock()
	defer s.state.mu.RUnlock()
	v, ok := s.state.retrievals[collectionID]
	if !ok {
		return domain.RetrievalCollection{}, fmt.Errorf("collection not found")
	}
	return v, nil
}
func (s *retrievalMemoryService) UpdateCollection(_ context.Context, collectionID string, req UpdateRetrievalCollectionRequest) (domain.RetrievalCollection, error) {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	v, ok := s.state.retrievals[collectionID]
	if !ok {
		return domain.RetrievalCollection{}, fmt.Errorf("collection not found")
	}
	if req.Name != nil {
		v.Name = *req.Name
	}
	if req.ProviderID != nil {
		v.ProviderID = *req.ProviderID
	}
	v.UpdatedAt = time.Now().UTC()
	s.state.retrievals[collectionID] = v
	return v, nil
}
func (s *retrievalMemoryService) DeleteCollection(_ context.Context, collectionID string) error {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	delete(s.state.retrievals, collectionID)
	return nil
}
func (s *retrievalMemoryService) ListDocuments(_ context.Context, collectionID string) ([]domain.RetrievalDocument, error) {
	s.state.mu.RLock()
	defer s.state.mu.RUnlock()
	out := []domain.RetrievalDocument{}
	for _, v := range s.state.documents {
		if v.CollectionID == collectionID {
			out = append(out, v)
		}
	}
	return out, nil
}
func (s *retrievalMemoryService) CreateDocument(_ context.Context, collectionID string, req CreateRetrievalDocumentRequest) (domain.RetrievalDocument, error) {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	s.state.init()
	d := domain.RetrievalDocument{ID: uuid.NewString(), CollectionID: collectionID, Filename: req.Filename, Status: "queued", CreatedAt: time.Now().UTC()}
	s.state.documents[d.ID] = d
	return d, nil
}
func (s *retrievalMemoryService) DeleteDocument(_ context.Context, _, documentID string) error {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	delete(s.state.documents, documentID)
	return nil
}
func (s *retrievalMemoryService) ReindexCollection(_ context.Context, collectionID string) error {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	c, ok := s.state.retrievals[collectionID]
	if !ok {
		return fmt.Errorf("collection not found")
	}
	c.IndexStatus = "indexing"
	c.UpdatedAt = time.Now().UTC()
	s.state.retrievals[collectionID] = c
	return nil
}

type mcpMemoryService struct{ state *memoryState }

func (s *mcpMemoryService) ListCollections(_ context.Context, scope domain.Scope, tenantID string) ([]domain.MCPCollection, error) {
	s.state.mu.RLock()
	defer s.state.mu.RUnlock()
	out := []domain.MCPCollection{}
	for _, c := range s.state.mcpCols {
		if c.Scope != scope {
			continue
		}
		if scope == domain.ScopeTenant && (c.TenantID == nil || *c.TenantID != tenantID) {
			continue
		}
		out = append(out, c)
	}
	return out, nil
}
func (s *mcpMemoryService) CreateCollection(_ context.Context, req CreateMCPCollectionRequest) (domain.MCPCollection, error) {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	s.state.init()
	c := domain.MCPCollection{ID: uuid.NewString(), Scope: req.Scope, Name: req.Name, UpdatedAt: time.Now().UTC()}
	if req.Scope == domain.ScopeTenant {
		c.TenantID = &req.TenantID
	}
	s.state.mcpCols[c.ID] = c
	return c, nil
}
func (s *mcpMemoryService) GetCollection(_ context.Context, collectionID string) (domain.MCPCollection, error) {
	s.state.mu.RLock()
	defer s.state.mu.RUnlock()
	c, ok := s.state.mcpCols[collectionID]
	if !ok {
		return domain.MCPCollection{}, fmt.Errorf("collection not found")
	}
	return c, nil
}
func (s *mcpMemoryService) UpdateCollection(_ context.Context, collectionID string, req UpdateMCPCollectionRequest) (domain.MCPCollection, error) {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	c, ok := s.state.mcpCols[collectionID]
	if !ok {
		return domain.MCPCollection{}, fmt.Errorf("collection not found")
	}
	if req.Name != nil {
		c.Name = *req.Name
	}
	c.UpdatedAt = time.Now().UTC()
	s.state.mcpCols[collectionID] = c
	return c, nil
}
func (s *mcpMemoryService) DeleteCollection(_ context.Context, collectionID string) error {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	delete(s.state.mcpCols, collectionID)
	return nil
}
func (s *mcpMemoryService) ListRecords(_ context.Context, collectionID string) ([]domain.MCPRecord, error) {
	s.state.mu.RLock()
	defer s.state.mu.RUnlock()
	out := []domain.MCPRecord{}
	for _, v := range s.state.mcpRecords {
		if v.CollectionID == collectionID {
			out = append(out, v)
		}
	}
	return out, nil
}
func (s *mcpMemoryService) CreateRecord(_ context.Context, collectionID string, req CreateMCPRecordRequest) (domain.MCPRecord, error) {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	s.state.init()
	r := domain.MCPRecord{ID: uuid.NewString(), CollectionID: collectionID, Key: req.Key, Value: req.Value, UpdatedAt: time.Now().UTC()}
	s.state.mcpRecords[r.ID] = r
	return r, nil
}
func (s *mcpMemoryService) UpdateRecord(_ context.Context, _, recordID string, req UpdateMCPRecordRequest) (domain.MCPRecord, error) {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	r, ok := s.state.mcpRecords[recordID]
	if !ok {
		return domain.MCPRecord{}, fmt.Errorf("record not found")
	}
	if req.Key != nil {
		r.Key = *req.Key
	}
	if req.Value != nil {
		r.Value = *req.Value
	}
	r.UpdatedAt = time.Now().UTC()
	s.state.mcpRecords[recordID] = r
	return r, nil
}
func (s *mcpMemoryService) DeleteRecord(_ context.Context, _, recordID string) error {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	delete(s.state.mcpRecords, recordID)
	return nil
}

type assistantMemoryService struct{ state *memoryState }

func (s *assistantMemoryService) List(_ context.Context, scope domain.Scope, tenantID string) ([]domain.Assistant, error) {
	s.state.mu.RLock()
	defer s.state.mu.RUnlock()
	out := []domain.Assistant{}
	for _, a := range s.state.assistants {
		if a.Scope != scope {
			continue
		}
		if scope == domain.ScopeTenant && (a.TenantID == nil || *a.TenantID != tenantID) {
			continue
		}
		out = append(out, a)
	}
	return out, nil
}
func (s *assistantMemoryService) Create(_ context.Context, req CreateAssistantRequest) (domain.Assistant, error) {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	s.state.init()
	if strings.TrimSpace(req.ProviderID) == "" {
		return domain.Assistant{}, fmt.Errorf("provider_id required")
	}
	a := domain.Assistant{ID: uuid.NewString(), Scope: req.Scope, Name: strings.TrimSpace(req.Name), Status: domain.StatusDraft, ProviderID: req.ProviderID, RetrievalCollectionIDs: req.RetrievalCollectionIDs, MCPCollectionIDs: req.MCPCollectionIDs, Version: "v1", UpdatedAt: time.Now().UTC()}
	if req.Scope == domain.ScopeTenant {
		a.TenantID = &req.TenantID
	}
	s.state.assistants[a.ID] = a
	return a, nil
}
func (s *assistantMemoryService) Get(_ context.Context, assistantID string) (domain.Assistant, error) {
	s.state.mu.RLock()
	defer s.state.mu.RUnlock()
	a, ok := s.state.assistants[assistantID]
	if !ok {
		return domain.Assistant{}, fmt.Errorf("assistant not found")
	}
	return a, nil
}
func (s *assistantMemoryService) Update(_ context.Context, assistantID string, req UpdateAssistantRequest) (domain.Assistant, error) {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	a, ok := s.state.assistants[assistantID]
	if !ok {
		return domain.Assistant{}, fmt.Errorf("assistant not found")
	}
	if req.Name != nil {
		a.Name = *req.Name
	}
	if req.ProviderID != nil && strings.TrimSpace(*req.ProviderID) != "" {
		a.ProviderID = strings.TrimSpace(*req.ProviderID)
	}
	if req.RetrievalCollectionIDs != nil {
		a.RetrievalCollectionIDs = *req.RetrievalCollectionIDs
	}
	if req.MCPCollectionIDs != nil {
		a.MCPCollectionIDs = *req.MCPCollectionIDs
	}
	a.UpdatedAt = time.Now().UTC()
	s.state.assistants[assistantID] = a
	return a, nil
}
func (s *assistantMemoryService) Delete(_ context.Context, assistantID string) error {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	delete(s.state.assistants, assistantID)
	return nil
}
func (s *assistantMemoryService) Activate(_ context.Context, assistantID string) error {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	a, ok := s.state.assistants[assistantID]
	if !ok {
		return fmt.Errorf("assistant not found")
	}
	a.Status = domain.StatusActive
	a.UpdatedAt = time.Now().UTC()
	s.state.assistants[assistantID] = a
	return nil
}
func (s *assistantMemoryService) Clone(_ context.Context, assistantID string, req CloneAssistantRequest) (domain.Assistant, error) {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	src, ok := s.state.assistants[assistantID]
	if !ok {
		return domain.Assistant{}, fmt.Errorf("assistant not found")
	}
	clone := src
	clone.ID = uuid.NewString()
	clone.Scope = req.TargetScope
	if req.TargetScope == domain.ScopeTenant {
		clone.TenantID = &req.TargetTenantID
	} else {
		clone.TenantID = nil
	}
	clone.Version = src.Version + "-clone"
	clone.UpdatedAt = time.Now().UTC()
	s.state.assistants[clone.ID] = clone
	return clone, nil
}
