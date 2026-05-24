package model

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"rotexai/core/orm/models"
	scommon "rotexai/core/schemas/common"
	smodel "rotexai/core/schemas/model"
	"rotexai/core/services/common"
)

type GormRepository struct {
	db *gorm.DB
}

func NewGormRepository(db *gorm.DB) *GormRepository {
	return &GormRepository{db: db}
}

func (r *GormRepository) List(ctx context.Context) ([]smodel.Item, error) {
	var rows []models.Model
	if err := r.db.WithContext(ctx).Order("updated_at desc").Find(&rows).Error; err != nil {
		return nil, err
	}
	out := make([]smodel.Item, 0, len(rows))
	for _, row := range rows {
		out = append(out, mapModel(row))
	}
	return out, nil
}

func (r *GormRepository) Create(ctx context.Context, req smodel.CreateRequest) (smodel.Item, error) {
	providerID, err := uuid.Parse(req.ProviderID)
	if err != nil {
		return smodel.Item{}, common.ErrInvalidInput
	}
	row := models.Model{
		ID:         uuid.New(),
		Name:       req.Name,
		ProviderID: providerID,
		Version:    req.Version,
		Status:     models.EntityStatus(req.Status),
	}
	if row.Status == "" {
		row.Status = models.EntityStatus(scommon.EntityStatusDraft)
	}
	if err := r.db.WithContext(ctx).Create(&row).Error; err != nil {
		return smodel.Item{}, err
	}
	return mapModel(row), nil
}

func (r *GormRepository) Get(ctx context.Context, modelID string) (smodel.Item, error) {
	id, err := uuid.Parse(modelID)
	if err != nil {
		return smodel.Item{}, common.ErrInvalidInput
	}
	var row models.Model
	if err := r.db.WithContext(ctx).First(&row, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return smodel.Item{}, common.ErrNotFound
		}
		return smodel.Item{}, err
	}
	return mapModel(row), nil
}

func (r *GormRepository) Update(ctx context.Context, modelID string, req smodel.UpdateRequest) (smodel.Item, error) {
	id, err := uuid.Parse(modelID)
	if err != nil {
		return smodel.Item{}, common.ErrInvalidInput
	}
	providerID, err := uuid.Parse(req.ProviderID)
	if err != nil {
		return smodel.Item{}, common.ErrInvalidInput
	}
	var row models.Model
	if err := r.db.WithContext(ctx).First(&row, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return smodel.Item{}, common.ErrNotFound
		}
		return smodel.Item{}, err
	}
	row.Name = req.Name
	row.ProviderID = providerID
	row.Version = req.Version
	row.Status = models.EntityStatus(req.Status)
	row.UpdatedAt = time.Now().UTC()
	if err := r.db.WithContext(ctx).Save(&row).Error; err != nil {
		return smodel.Item{}, err
	}
	return mapModel(row), nil
}

func (r *GormRepository) Delete(ctx context.Context, modelID string) error {
	id, err := uuid.Parse(modelID)
	if err != nil {
		return common.ErrInvalidInput
	}
	res := r.db.WithContext(ctx).Delete(&models.Model{}, "id = ?", id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return common.ErrNotFound
	}
	return nil
}

func mapModel(in models.Model) smodel.Item {
	return smodel.Item{
		ID:         in.ID.String(),
		Name:       in.Name,
		ProviderID: in.ProviderID.String(),
		Version:    in.Version,
		Status:     scommon.EntityStatus(in.Status),
		UpdatedAt:  in.UpdatedAt,
	}
}
