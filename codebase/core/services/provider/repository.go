package provider

import (
	"context"

	sprovider "rotexai/core/schemas/provider"
)

type Repository interface {
	List(ctx context.Context) ([]sprovider.Item, error)
	Create(ctx context.Context, req sprovider.CreateRequest) (sprovider.Item, error)
	Update(ctx context.Context, providerID string, req sprovider.UpdateRequest) (sprovider.Item, error)
	Toggle(ctx context.Context, providerID string) (sprovider.Item, error)
	Reorder(ctx context.Context, providerIDs []string) error
}
