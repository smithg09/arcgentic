package earnedskill

import (
	db "github.com/smithg09/core/internal/actor/db/sql"
	earnedskillQuerier "github.com/smithg09/core/internal/module/earnedskill/earnedskill-querier"
)

type earnedSkillModule struct {
	service EarnedSkillService
}

func NewEarnedSkillModule(db db.DB) *earnedSkillModule {
	querier := earnedskillQuerier.New(db.GetDB())
	repository := NewPostgresEarnedSkillRepository(querier)
	service := NewEarnedSkillService(repository)
	return &earnedSkillModule{service: service}
}

func (m *earnedSkillModule) GetService() EarnedSkillService {
	return m.service
}
