package provider

import (
	"context"

	sprovider "rotexai/core/schemas/provider"
	"rotexai/core/services/common"
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) List(ctx context.Context) ([]sprovider.Item, error) {
	return s.repo.List(ctx)
}

func (s *Service) Create(ctx context.Context, req sprovider.CreateRequest) (sprovider.Item, error) {
	if req.Name == "" || req.Environment == "" || req.Priority < 1 {
		return sprovider.Item{}, common.ErrInvalidInput
	}
	return s.repo.Create(ctx, req)
}

func (s *Service) Update(ctx context.Context, providerID string, req sprovider.UpdateRequest) (sprovider.Item, error) {
	if providerID == "" {
		return sprovider.Item{}, common.ErrInvalidInput
	}
	return s.repo.Update(ctx, providerID, req)
}

func (s *Service) Toggle(ctx context.Context, providerID string) (sprovider.Item, error) {
	if providerID == "" {
		return sprovider.Item{}, common.ErrInvalidInput
	}
	return s.repo.Toggle(ctx, providerID)
}

func (s *Service) Reorder(ctx context.Context, providerIDs []string) error {
	if len(providerIDs) == 0 {
		return common.ErrInvalidInput
	}
	return s.repo.Reorder(ctx, providerIDs)
}
