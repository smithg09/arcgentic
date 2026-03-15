package user

import (
	"context"

	"github.com/google/uuid"
)

type userService struct {
	repository UserRepository
}

func NewUserService(repository UserRepository) *userService {
	return &userService{repository: repository}
}

func (s *userService) CreateUser(ctx context.Context, data CreateDto) (*User, error) {
	return s.repository.CreateOne(ctx, data)
}

func (s *userService) GetUser(ctx context.Context, id uuid.UUID) (*User, error) {
	return s.repository.GetOneById(ctx, id)
}

func (s *userService) UpdateUser(ctx context.Context, id uuid.UUID, data UpdateDto) (*User, error) {
	return s.repository.UpdateOneById(ctx, id, data)
}

func (s *userService) DeleteUser(ctx context.Context, id uuid.UUID) error {
	return s.repository.DeleteOne(ctx, id)
}
