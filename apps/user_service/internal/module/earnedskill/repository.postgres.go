package earnedskill

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	earnedskillQuerier "github.com/smithg09/core/internal/module/earnedskill/earnedskill-querier"
)

var ErrEarnedSkillsNotFound = fmt.Errorf("earned skills are not found")

type postgresEarnedSkillRepository struct {
	querier earnedskillQuerier.Querier
	logger  zerolog.Logger
}

func NewPostgresEarnedSkillRepository(querier earnedskillQuerier.Querier) *postgresEarnedSkillRepository {
	return &postgresEarnedSkillRepository{
		querier: querier,
		logger: log.
			With().
			Str("module", "earnedskill").
			Str("provider", "repository").
			Logger(),
	}
}

func (r *postgresEarnedSkillRepository) GetOneByUserID(ctx context.Context, userID uuid.UUID) (*EarnedSkill, error) {
	model, err := r.querier.GetOneByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrEarnedSkillsNotFound
		}
		r.logger.
			Error().
			Err(err).
			Str("method", "GetOneByUserID").
			Str("event", "call querier.GetOneByUserID").
			Send()
		return nil, err
	}

	return r.buildModelFromQuerier(model), nil
}

func (r *postgresEarnedSkillRepository) UpsertOne(ctx context.Context, data UpsertDto) (*EarnedSkill, error) {
	params := earnedskillQuerier.UpsertOneParams{
		UserID:     data.UserID,
		Skills:     data.Skills,
		SessionIds: data.SessionIDs,
	}

	model, err := r.querier.UpsertOne(ctx, params)
	if err != nil {
		r.logger.
			Error().
			Err(err).
			Str("method", "UpsertOne").
			Str("event", "call querier.UpsertOne").
			Send()
		return nil, err
	}

	return r.buildModelFromQuerier(model), nil
}

func (r *postgresEarnedSkillRepository) buildModelFromQuerier(qm earnedskillQuerier.EarnedSkill) *EarnedSkill {
	return &EarnedSkill{
		UserID:     qm.UserID,
		Skills:     qm.Skills,
		SessionIDs: qm.SessionIds,
		CreatedAt:  qm.CreatedAt,
		UpdatedAt:  qm.UpdatedAt,
	}
}
