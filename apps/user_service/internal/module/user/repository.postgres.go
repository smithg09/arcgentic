package user

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	userQuerier "github.com/smithg09/core/internal/module/user/user-querier"
)

var ErrUserNotFound = fmt.Errorf("user is not found")

type postgresUserRepository struct {
	querier userQuerier.Querier
	logger  zerolog.Logger
}

func NewPostgresUserRepository(querier userQuerier.Querier) *postgresUserRepository {
	return &postgresUserRepository{
		querier: querier,
		logger: log.
			With().
			Str("module", "user").
			Str("provider", "repository").
			Logger(),
	}
}

func (r *postgresUserRepository) CreateOne(ctx context.Context, data CreateDto) (*User, error) {
	llmPreferences := ""
	if data.LlmPreferences != nil {
		llmPreferences = *data.LlmPreferences
	}

	params := userQuerier.CreateOneParams{
		Name:             data.Name,
		Email:            data.Email,
		ProfessionalRole: data.ProfessionalRole,
		LlmPreferences:   llmPreferences,
	}

	qm, err := r.querier.CreateOne(ctx, params)
	if err != nil {
		r.logger.
			Error().
			Err(err).
			Str("method", "CreateOne").
			Str("event", "call querier.CreateOne").
			Send()
		return nil, err
	}

	return r.buildModelFromQuerier(qm), nil
}

func (r *postgresUserRepository) GetOneById(ctx context.Context, id uuid.UUID) (*User, error) {
	model, err := r.querier.GetOneById(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		r.logger.
			Error().
			Err(err).
			Str("method", "GetOneById").
			Str("event", "call querier.GetOneById").
			Send()
		return nil, err
	}

	return r.buildModelFromQuerier(model), nil
}

func (r *postgresUserRepository) UpdateOneById(ctx context.Context, id uuid.UUID, data UpdateDto) (*User, error) {
	params := userQuerier.UpdateOneByIdParams{ID: id}
	if data.Name != nil {
		params.Name = sql.NullString{Valid: true, String: *data.Name}
	}
	if data.Email != nil {
		params.Email = sql.NullString{Valid: true, String: *data.Email}
	}
	if data.ProfessionalRole != nil {
		params.ProfessionalRole = sql.NullString{Valid: true, String: *data.ProfessionalRole}
	}
	if data.LlmPreferences != nil {
		params.LlmPreferences = sql.NullString{Valid: true, String: *data.LlmPreferences}
	}

	qm, err := r.querier.UpdateOneById(ctx, params)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		r.logger.
			Error().
			Err(err).
			Str("method", "UpdateOneById").
			Str("event", "call querier.UpdateOneById").
			Send()
		return nil, err
	}

	return r.buildModelFromQuerier(qm), nil
}

func (r *postgresUserRepository) GetAll(ctx context.Context) ([]User, error) {
	models, err := r.querier.GetAll(ctx)
	if err != nil {
		r.logger.
			Error().
			Err(err).
			Str("method", "GetAll").
			Str("event", "call querier.GetAll").
			Send()
		return nil, err
	}

	items := make([]User, len(models))
	for i, model := range models {
		items[i] = *r.buildModelFromQuerier(model)
	}

	return items, nil
}

func (r *postgresUserRepository) DeleteOne(ctx context.Context, id uuid.UUID) error {
	deletedRows, err := r.querier.DeleteOne(ctx, id)
	if err != nil {
		r.logger.
			Error().
			Err(err).
			Str("method", "DeleteOne").
			Str("event", "call querier.DeleteOne").
			Send()
		return err
	}
	if deletedRows == 0 {
		return ErrUserNotFound
	}

	return nil
}

func (r *postgresUserRepository) buildModelFromQuerier(qm userQuerier.User) *User {
	return &User{
		Id:               qm.ID,
		Name:             qm.Name,
		Email:            qm.Email,
		ProfessionalRole: qm.ProfessionalRole,
		LlmPreferences:   qm.LlmPreferences,
		CreatedAt:        qm.CreatedAt,
		UpdatedAt:        qm.UpdatedAt,
	}
}
