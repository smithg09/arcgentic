package earnedskill

import (
	"context"
	"time"

	"github.com/google/uuid"
)

//go:generate make name=EarnedSkillService mock
//go:generate make name=EarnedSkillRepository mock

type EarnedSkillService interface {
	GetEarnedSkills(ctx context.Context, userID uuid.UUID) (*EarnedSkill, error)
	UpsertEarnedSkills(ctx context.Context, data UpsertDto) (*EarnedSkill, error)
}

type EarnedSkillRepository interface {
	GetOneByUserID(ctx context.Context, userID uuid.UUID) (*EarnedSkill, error)
	UpsertOne(ctx context.Context, data UpsertDto) (*EarnedSkill, error)
}

type EarnedSkill struct {
	UserID     uuid.UUID   `json:"userId"`
	Skills     []string    `json:"skills"`
	SessionIDs []uuid.UUID `json:"sessionIds"`
	CreatedAt  time.Time   `json:"createdAt"`
	UpdatedAt  time.Time   `json:"updatedAt"`
}

type UpsertDto struct {
	UserID     uuid.UUID   `json:"userId"`
	Skills     []string    `json:"skills"`
	SessionIDs []uuid.UUID `json:"sessionIds"`
}
