package session

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	sessionQuerier "github.com/smithg09/core/internal/module/session/session-querier"
)

var ErrSessionNotFound = fmt.Errorf("session is not found")

type postgresSessionRepository struct {
	querier sessionQuerier.Querier
	logger  zerolog.Logger
}

func NewPostgresSessionRepository(querier sessionQuerier.Querier) *postgresSessionRepository {
	return &postgresSessionRepository{
		querier: querier,
		logger: log.
			With().
			Str("module", "session").
			Str("provider", "repository").
			Logger(),
	}
}

func (r *postgresSessionRepository) CreateOne(ctx context.Context, data CreateDto) (*Session, error) {
	isMarkedCompleted := false
	if data.IsMarkedCompleted != nil {
		isMarkedCompleted = *data.IsMarkedCompleted
	}

	params := sessionQuerier.CreateOneParams{
		UserID:            data.UserID,
		IsMarkedCompleted: isMarkedCompleted,
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

func (r *postgresSessionRepository) GetOneById(ctx context.Context, id uuid.UUID) (*Session, error) {
	model, err := r.querier.GetOneById(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrSessionNotFound
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

func (r *postgresSessionRepository) GetMany(ctx context.Context, where *WhereDto) ([]Session, error) {
	params := sessionQuerier.GetManyParams{}
	if where != nil {
		if where.UserID != nil {
			if where.UserID.Eq != nil {
				params.UserIDEq = uuid.NullUUID{UUID: *where.UserID.Eq, Valid: true}
			}
			if len(where.UserID.In) > 0 {
				params.UserIDIn = where.UserID.In
			}
		}
		if where.IsMarkedCompleted != nil {
			params.IsMarkedCompleted = sql.NullBool{Bool: *where.IsMarkedCompleted, Valid: true}
		}

		orderBy := "updated_at"
		sortOrder := "desc"
		if where.Sort != nil {
			orderBy = where.Sort.SortBy
			if where.Sort.SortOrder != nil {
				sortOrder = string(*where.Sort.SortOrder)
			}
		}
		params.SortQuery = sql.NullString{Valid: true, String: fmt.Sprintf("%s__%s", orderBy, sortOrder)}

		if where.Pagination != nil {
			params.Limit = sql.NullInt32{Valid: true, Int32: int32(where.Pagination.Limit)}
			params.Offset = sql.NullInt32{Valid: true, Int32: int32(where.Pagination.Skip)}
		}
	}

	models, err := r.querier.GetMany(ctx, params)
	if err != nil {
		r.logger.
			Error().
			Err(err).
			Str("method", "GetMany").
			Str("event", "call querier.GetMany").
			Send()
		return nil, err
	}

	items := make([]Session, len(models))
	for i, model := range models {
		items[i] = *r.buildModelFromQuerier(model)
	}

	return items, nil
}

func (r *postgresSessionRepository) UpdateOneById(ctx context.Context, id uuid.UUID, data UpdateDto) (*Session, error) {
	params := sessionQuerier.UpdateOneByIdParams{ID: id}
	if data.UserID != nil {
		params.UserID = uuid.NullUUID{Valid: true, UUID: *data.UserID}
	}
	if data.IsMarkedCompleted != nil {
		params.IsMarkedCompleted = sql.NullBool{Valid: true, Bool: *data.IsMarkedCompleted}
	}

	qm, err := r.querier.UpdateOneById(ctx, params)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrSessionNotFound
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

func (r *postgresSessionRepository) buildModelFromQuerier(qm sessionQuerier.Session) *Session {
	return &Session{
		SessionID:         qm.SessionID,
		UserID:            qm.UserID,
		IsMarkedCompleted: qm.IsMarkedCompleted,
		CreatedAt:         qm.CreatedAt,
		UpdatedAt:         qm.UpdatedAt,
	}
}
