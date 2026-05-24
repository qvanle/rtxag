package application

import (
	"context"

	"github.com/google/uuid"

	"rotexai/core/api/internal/domain"
	scommon "rotexai/core/schemas/common"
	smodel "rotexai/core/schemas/model"
	sprovider "rotexai/core/schemas/provider"
	modelsvc "rotexai/core/services/model"
	providersvc "rotexai/core/services/provider"
)

type ModelServiceAdapter struct {
	svc *modelsvc.Service
}

func NewModelServiceAdapter(svc *modelsvc.Service) *ModelServiceAdapter {
	return &ModelServiceAdapter{svc: svc}
}

func (a *ModelServiceAdapter) List(ctx context.Context) ([]domain.Model, error) {
	rows, err := a.svc.List(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]domain.Model, 0, len(rows))
	for _, row := range rows {
		out = append(out, domain.Model{
			ID:        row.ID,
			Name:      row.Name,
			Provider:  row.ProviderID,
			Version:   row.Version,
			Status:    domain.Status(row.Status),
			UpdatedAt: row.UpdatedAt,
		})
	}
	return out, nil
}

func (a *ModelServiceAdapter) Create(ctx context.Context, req CreateModelRequest) (domain.Model, error) {
	providerID := req.Provider
	if providerID == "" {
		providerID = uuid.Nil.String()
	}
	row, err := a.svc.Create(ctx, smodel.CreateRequest{
		Name:       req.Name,
		ProviderID: providerID,
		Version:    req.Version,
		Status:     scommon.EntityStatus(req.Status),
	})
	if err != nil {
		return domain.Model{}, err
	}
	return domain.Model{ID: row.ID, Name: row.Name, Provider: row.ProviderID, Version: row.Version, Status: domain.Status(row.Status), UpdatedAt: row.UpdatedAt}, nil
}

func (a *ModelServiceAdapter) Get(ctx context.Context, modelID string) (domain.Model, error) {
	row, err := a.svc.Get(ctx, modelID)
	if err != nil {
		return domain.Model{}, err
	}
	return domain.Model{ID: row.ID, Name: row.Name, Provider: row.ProviderID, Version: row.Version, Status: domain.Status(row.Status), UpdatedAt: row.UpdatedAt}, nil
}

func (a *ModelServiceAdapter) Update(ctx context.Context, modelID string, req UpdateModelRequest) (domain.Model, error) {
	row, err := a.svc.Update(ctx, modelID, smodel.UpdateRequest{
		Name:       req.Name,
		ProviderID: req.Provider,
		Version:    req.Version,
		Status:     scommon.EntityStatus(req.Status),
	})
	if err != nil {
		return domain.Model{}, err
	}
	return domain.Model{ID: row.ID, Name: row.Name, Provider: row.ProviderID, Version: row.Version, Status: domain.Status(row.Status), UpdatedAt: row.UpdatedAt}, nil
}

func (a *ModelServiceAdapter) Delete(ctx context.Context, modelID string) error {
	return a.svc.Delete(ctx, modelID)
}

type ProviderServiceAdapter struct {
	svc *providersvc.Service
}

func NewProviderServiceAdapter(svc *providersvc.Service) *ProviderServiceAdapter {
	return &ProviderServiceAdapter{svc: svc}
}

func (a *ProviderServiceAdapter) List(ctx context.Context) ([]domain.Provider, error) {
	rows, err := a.svc.List(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]domain.Provider, 0, len(rows))
	for _, row := range rows {
		out = append(out, domain.Provider{ID: row.ID, Name: row.Name, Environment: row.Environment, Priority: row.Priority, APIKeyMasked: row.APIKeyMasked, Enabled: row.Enabled, UpdatedAt: row.UpdatedAt})
	}
	return out, nil
}

func (a *ProviderServiceAdapter) Create(ctx context.Context, req CreateProviderRequest) (domain.Provider, error) {
	row, err := a.svc.Create(ctx, sprovider.CreateRequest{Name: req.Name, Environment: req.Environment, Priority: req.Priority, APIKey: req.APIKey, Enabled: req.Enabled})
	if err != nil {
		return domain.Provider{}, err
	}
	return domain.Provider{ID: row.ID, Name: row.Name, Environment: row.Environment, Priority: row.Priority, APIKeyMasked: row.APIKeyMasked, Enabled: row.Enabled, UpdatedAt: row.UpdatedAt}, nil
}

func (a *ProviderServiceAdapter) Update(ctx context.Context, providerID string, req UpdateProviderRequest) (domain.Provider, error) {
	row, err := a.svc.Update(ctx, providerID, sprovider.UpdateRequest{Name: req.Name, Environment: req.Environment, Priority: req.Priority, APIKey: req.APIKey, Enabled: req.Enabled})
	if err != nil {
		return domain.Provider{}, err
	}
	return domain.Provider{ID: row.ID, Name: row.Name, Environment: row.Environment, Priority: row.Priority, APIKeyMasked: row.APIKeyMasked, Enabled: row.Enabled, UpdatedAt: row.UpdatedAt}, nil
}

func (a *ProviderServiceAdapter) Toggle(ctx context.Context, providerID string) (domain.Provider, error) {
	row, err := a.svc.Toggle(ctx, providerID)
	if err != nil {
		return domain.Provider{}, err
	}
	return domain.Provider{ID: row.ID, Name: row.Name, Environment: row.Environment, Priority: row.Priority, APIKeyMasked: row.APIKeyMasked, Enabled: row.Enabled, UpdatedAt: row.UpdatedAt}, nil
}

func (a *ProviderServiceAdapter) Reorder(ctx context.Context, providerIDs []string) error {
	return a.svc.Reorder(ctx, providerIDs)
}
