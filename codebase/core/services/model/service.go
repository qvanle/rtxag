package model

import (
	"context"

	smodel "rotexai/core/schemas/model"
	"rotexai/core/services/common"
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) List(ctx context.Context) ([]smodel.Item, error) {
	return s.repo.List(ctx)
}

func (s *Service) Create(ctx context.Context, req smodel.CreateRequest) (smodel.Item, error) {
	if req.Name == "" || req.ProviderID == "" || req.Version == "" {
		return smodel.Item{}, common.ErrInvalidInput
	}
	return s.repo.Create(ctx, req)
}

func (s *Service) Get(ctx context.Context, modelID string) (smodel.Item, error) {
	if modelID == "" {
		return smodel.Item{}, common.ErrInvalidInput
	}
	return s.repo.Get(ctx, modelID)
}

func (s *Service) Update(ctx context.Context, modelID string, req smodel.UpdateRequest) (smodel.Item, error) {
	if modelID == "" {
		return smodel.Item{}, common.ErrInvalidInput
	}
	return s.repo.Update(ctx, modelID, req)
}

func (s *Service) Delete(ctx context.Context, modelID string) error {
	if modelID == "" {
		return common.ErrInvalidInput
	}
	return s.repo.Delete(ctx, modelID)
}
