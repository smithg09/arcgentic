package graph

import (
	"github.com/smithg09/core/internal/module/earnedskill"
	"github.com/smithg09/core/internal/module/session"
	"github.com/smithg09/core/internal/module/user"
)

// This file will not be regenerated automatically.
//
// It serves as dependency injection for your app, add any dependencies you require here.

type Resolver struct {
	UserService        user.UserService
	SessionService     session.SessionService
	EarnedSkillService earnedskill.EarnedSkillService
}
