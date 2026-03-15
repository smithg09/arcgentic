package session

import (
	"context"

	"github.com/google/uuid"
)

type sessionService struct {
	repository SessionRepository
}

func NewSessionService(repository SessionRepository) *sessionService {
	return &sessionService{repository: repository}
}

func (s *sessionService) CreateSession(ctx context.Context, data CreateDto) (*Session, error) {
	return s.repository.CreateOne(ctx, data)
}

func (s *sessionService) GetSession(ctx context.Context, id uuid.UUID) (*Session, error) {
	return s.repository.GetOneById(ctx, id)
}

func (s *sessionService) ListSessions(ctx context.Context, where *WhereDto) ([]Session, error) {
	return s.repository.GetMany(ctx, where)
}

func (s *sessionService) UpdateSession(ctx context.Context, id uuid.UUID, data UpdateDto) (*Session, error) {
	return s.repository.UpdateOneById(ctx, id, data)
}
