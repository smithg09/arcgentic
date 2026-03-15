package user

import (
	"context"
	"time"

	"github.com/google/uuid"
)

//go:generate make name=UserService mock
//go:generate make name=UserRepository mock

type UserService interface {
	CreateUser(ctx context.Context, data CreateDto) (*User, error)
	GetUser(ctx context.Context, id uuid.UUID) (*User, error)
	UpdateUser(ctx context.Context, id uuid.UUID, data UpdateDto) (*User, error)
	DeleteUser(ctx context.Context, id uuid.UUID) error
}

type UserRepository interface {
	CreateOne(ctx context.Context, data CreateDto) (*User, error)
	GetOneById(ctx context.Context, id uuid.UUID) (*User, error)
	UpdateOneById(ctx context.Context, id uuid.UUID, data UpdateDto) (*User, error)
	DeleteOne(ctx context.Context, id uuid.UUID) error
}

type User struct {
	Id               uuid.UUID `json:"id"`
	Name             string    `json:"name"`
	Email            string    `json:"email"`
	ProfessionalRole string    `json:"professionalRole"`
	LlmPreferences   string    `json:"llmPreferences"`
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
}

type CreateDto struct {
	Name             string  `json:"name"`
	Email            string  `json:"email"`
	ProfessionalRole string  `json:"professionalRole"`
	LlmPreferences   *string `json:"llmPreferences"`
}

type UpdateDto struct {
	Name             *string `json:"name"`
	Email            *string `json:"email"`
	ProfessionalRole *string `json:"professionalRole"`
	LlmPreferences   *string `json:"llmPreferences"`
}
