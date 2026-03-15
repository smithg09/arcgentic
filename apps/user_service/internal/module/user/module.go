package user

import (
	db "github.com/smithg09/core/internal/actor/db/sql"
	userQuerier "github.com/smithg09/core/internal/module/user/user-querier"
)

type userModule struct {
	service UserService
}

func NewUserModule(db db.DB) *userModule {
	querier := userQuerier.New(db.GetDB())
	repository := NewPostgresUserRepository(querier)
	service := NewUserService(repository)
	return &userModule{service: service}
}

func (m *userModule) GetService() UserService {
	return m.service
}
