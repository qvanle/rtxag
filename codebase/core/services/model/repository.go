package model

import (
	"context"

	smodel "rotexai/core/schemas/model"
)

type Repository interface {
	List(ctx context.Context) ([]smodel.Item, error)
	Create(ctx context.Context, req smodel.CreateRequest) (smodel.Item, error)
	Get(ctx context.Context, modelID string) (smodel.Item, error)
	Update(ctx context.Context, modelID string, req smodel.UpdateRequest) (smodel.Item, error)
	Delete(ctx context.Context, modelID string) error
}
