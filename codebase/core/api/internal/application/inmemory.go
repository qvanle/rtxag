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
	Model     ModelService
	Provider  ProviderService
	Retrieval RetrievalService
	MCP       MCPService
	Assistant AssistantService
}

func NewInMemoryServices() *InMemoryServices {
	state := &memoryState{}
	return &InMemoryServices{
		Dashboard: &dashboardMemoryService{},
		Model:     &modelMemoryService{state: state},
		Provider:  &providerMemoryService{state: state},
		Retrieval: &retrievalMemoryService{state: state},
		MCP:       &mcpMemoryService{state: state},
		Assistant: &assistantMemoryService{state: state},
	}
}

type memoryState struct {
	mu          sync.RWMutex
	models      map[string]domain.Model
	providers   map[string]domain.Provider
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
	s.models = map[string]domain.Model{}
	s.providers = map[string]domain.Provider{}
	s.retrievals = map[string]domain.RetrievalCollection{}
	s.documents = map[string]domain.RetrievalDocument{}
	s.mcpCols = map[string]domain.MCPCollection{}
	s.mcpRecords = map[string]domain.MCPRecord{}
	s.assistants = map[string]domain.Assistant{}
	s.initialized = true
}

type dashboardMemoryService struct{}

func (s *dashboardMemoryService) GetGlobal(context.Context) (domain.DashboardGlobal, error) {
	return domain.DashboardGlobal{
		TokenConsumption: "0",
		TenantCost:       "0",
		APIErrorRate:     "0%",
		P95Latency:       "0ms",
		TrafficSummary:   "no data",
	}, nil
}

func (s *dashboardMemoryService) ListTenants(context.Context, Pagination, string, string) ([]domain.DashboardTenantRow, error) {
	return []domain.DashboardTenantRow{}, nil
}

type modelMemoryService struct{ state *memoryState }

func (s *modelMemoryService) List(context.Context) ([]domain.Model, error) {
	s.state.mu.RLock()
	defer s.state.mu.RUnlock()
	rows := make([]domain.Model, 0, len(s.state.models))
	for _, m := range s.state.models {
		rows = append(rows, m)
	}
	return rows, nil
}
func (s *modelMemoryService) Create(_ context.Context, req CreateModelRequest) (domain.Model, error) {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	s.state.init()
	id := uuid.NewString()
	m := domain.Model{ID: id, Name: req.Name, Provider: req.Provider, Version: req.Version, Status: req.Status, UpdatedAt: time.Now().UTC()}
	s.state.models[id] = m
	return m, nil
}
func (s *modelMemoryService) Get(_ context.Context, modelID string) (domain.Model, error) {
	s.state.mu.RLock()
	defer s.state.mu.RUnlock()
	m, ok := s.state.models[modelID]
	if !ok {
		return domain.Model{}, fmt.Errorf("model not found")
	}
	return m, nil
}
func (s *modelMemoryService) Update(_ context.Context, modelID string, req UpdateModelRequest) (domain.Model, error) {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	m, ok := s.state.models[modelID]
	if !ok {
		return domain.Model{}, fmt.Errorf("model not found")
	}
	m.Name, m.Provider, m.Version, m.Status, m.UpdatedAt = req.Name, req.Provider, req.Version, req.Status, time.Now().UTC()
	s.state.models[modelID] = m
	return m, nil
}
func (s *modelMemoryService) Delete(_ context.Context, modelID string) error {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	delete(s.state.models, modelID)
	return nil
}

type providerMemoryService struct{ state *memoryState }

func (s *providerMemoryService) List(context.Context) ([]domain.Provider, error) {
	s.state.mu.RLock()
	defer s.state.mu.RUnlock()
	rows := make([]domain.Provider, 0, len(s.state.providers))
	for _, p := range s.state.providers {
		rows = append(rows, p)
	}
	return rows, nil
}
func (s *providerMemoryService) Create(_ context.Context, req CreateProviderRequest) (domain.Provider, error) {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	s.state.init()
	p := domain.Provider{ID: uuid.NewString(), Name: req.Name, Environment: req.Environment, Priority: req.Priority, APIKeyMasked: "***", Enabled: req.Enabled, UpdatedAt: time.Now().UTC()}
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
	p.Name, p.Environment, p.Priority, p.Enabled, p.UpdatedAt = req.Name, req.Environment, req.Priority, req.Enabled, time.Now().UTC()
	s.state.providers[providerID] = p
	return p, nil
}
func (s *providerMemoryService) Toggle(_ context.Context, providerID string) (domain.Provider, error) {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	p, ok := s.state.providers[providerID]
	if !ok {
		return domain.Provider{}, fmt.Errorf("provider not found")
	}
	p.Enabled = !p.Enabled
	p.UpdatedAt = time.Now().UTC()
	s.state.providers[providerID] = p
	return p, nil
}
func (s *providerMemoryService) Reorder(_ context.Context, providerIDs []string) error {
	s.state.mu.Lock()
	defer s.state.mu.Unlock()
	for i, id := range providerIDs {
		p, ok := s.state.providers[id]
		if !ok {
			continue
		}
		p.Priority = i + 1
		s.state.providers[id] = p
	}
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
	col := domain.RetrievalCollection{ID: uuid.NewString(), Scope: req.Scope, Name: req.Name, EmbeddingModelID: req.EmbeddingModelID, IndexStatus: "queued", UpdatedAt: time.Now().UTC()}
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
	if req.EmbeddingModelID != nil {
		v.EmbeddingModelID = *req.EmbeddingModelID
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
	if len(req.ModelIDs) == 0 {
		return domain.Assistant{}, fmt.Errorf("model_ids required")
	}
	a := domain.Assistant{ID: uuid.NewString(), Scope: req.Scope, Name: strings.TrimSpace(req.Name), Status: domain.StatusDraft, ModelIDs: req.ModelIDs, RetrievalCollectionIDs: req.RetrievalCollectionIDs, MCPCollectionIDs: req.MCPCollectionIDs, Version: "v1", UpdatedAt: time.Now().UTC()}
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
	if req.ModelIDs != nil && len(*req.ModelIDs) > 0 {
		a.ModelIDs = *req.ModelIDs
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
