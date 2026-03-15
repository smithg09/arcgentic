package earnedskill

import (
	"context"

	"github.com/google/uuid"
)

type earnedSkillService struct {
	repository EarnedSkillRepository
}

func NewEarnedSkillService(repository EarnedSkillRepository) *earnedSkillService {
	return &earnedSkillService{repository: repository}
}

func (s *earnedSkillService) GetEarnedSkills(ctx context.Context, userID uuid.UUID) (*EarnedSkill, error) {
	return s.repository.GetOneByUserID(ctx, userID)
}

func (s *earnedSkillService) UpsertEarnedSkills(ctx context.Context, data UpsertDto) (*EarnedSkill, error) {
	return s.repository.UpsertOne(ctx, data)
}
