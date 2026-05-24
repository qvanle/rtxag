package provider

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"rotexai/core/orm/models"
	sprovider "rotexai/core/schemas/provider"
	"rotexai/core/services/common"
)

type GormRepository struct {
	db *gorm.DB
}

func NewGormRepository(db *gorm.DB) *GormRepository {
	return &GormRepository{db: db}
}

func (r *GormRepository) List(ctx context.Context) ([]sprovider.Item, error) {
	var rows []models.Provider
	if err := r.db.WithContext(ctx).Order("priority asc").Find(&rows).Error; err != nil {
		return nil, err
	}
	out := make([]sprovider.Item, 0, len(rows))
	for _, row := range rows {
		out = append(out, mapProvider(row))
	}
	return out, nil
}

func (r *GormRepository) Create(ctx context.Context, req sprovider.CreateRequest) (sprovider.Item, error) {
	row := models.Provider{
		ID:           uuid.New(),
		Name:         req.Name,
		Environment:  models.Environment(req.Environment),
		Priority:     req.Priority,
		APIKeyMasked: "***",
		Enabled:      req.Enabled,
	}
	if err := r.db.WithContext(ctx).Create(&row).Error; err != nil {
		return sprovider.Item{}, err
	}
	return mapProvider(row), nil
}

func (r *GormRepository) Update(ctx context.Context, providerID string, req sprovider.UpdateRequest) (sprovider.Item, error) {
	id, err := uuid.Parse(providerID)
	if err != nil {
		return sprovider.Item{}, common.ErrInvalidInput
	}
	var row models.Provider
	if err := r.db.WithContext(ctx).First(&row, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return sprovider.Item{}, common.ErrNotFound
		}
		return sprovider.Item{}, err
	}
	row.Name = req.Name
	row.Environment = models.Environment(req.Environment)
	row.Priority = req.Priority
	row.Enabled = req.Enabled
	row.UpdatedAt = time.Now().UTC()
	if err := r.db.WithContext(ctx).Save(&row).Error; err != nil {
		return sprovider.Item{}, err
	}
	return mapProvider(row), nil
}

func (r *GormRepository) Toggle(ctx context.Context, providerID string) (sprovider.Item, error) {
	id, err := uuid.Parse(providerID)
	if err != nil {
		return sprovider.Item{}, common.ErrInvalidInput
	}
	var row models.Provider
	if err := r.db.WithContext(ctx).First(&row, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return sprovider.Item{}, common.ErrNotFound
		}
		return sprovider.Item{}, err
	}
	row.Enabled = !row.Enabled
	row.UpdatedAt = time.Now().UTC()
	if err := r.db.WithContext(ctx).Save(&row).Error; err != nil {
		return sprovider.Item{}, err
	}
	return mapProvider(row), nil
}

func (r *GormRepository) Reorder(ctx context.Context, providerIDs []string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for i, rawID := range providerIDs {
			id, err := uuid.Parse(rawID)
			if err != nil {
				return common.ErrInvalidInput
			}
			res := tx.Model(&models.Provider{}).Where("id = ?", id).Update("priority", i+1)
			if res.Error != nil {
				return res.Error
			}
			if res.RowsAffected == 0 {
				return fmt.Errorf("%w: provider %s", common.ErrNotFound, rawID)
			}
		}
		return nil
	})
}

func mapProvider(in models.Provider) sprovider.Item {
	return sprovider.Item{
		ID:           in.ID.String(),
		Name:         in.Name,
		Environment:  string(in.Environment),
		Priority:     in.Priority,
		APIKeyMasked: in.APIKeyMasked,
		Enabled:      in.Enabled,
		UpdatedAt:    in.UpdatedAt,
	}
}
