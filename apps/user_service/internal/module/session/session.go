package session

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/smithg09/core/internal/util/filter"
)

//go:generate make name=SessionService mock
//go:generate make name=SessionRepository mock

type SessionService interface {
	CreateSession(ctx context.Context, data CreateDto) (*Session, error)
	GetSession(ctx context.Context, id uuid.UUID) (*Session, error)
	ListSessions(ctx context.Context, where *WhereDto) ([]Session, error)
	UpdateSession(ctx context.Context, id uuid.UUID, data UpdateDto) (*Session, error)
}

type SessionRepository interface {
	CreateOne(ctx context.Context, data CreateDto) (*Session, error)
	GetOneById(ctx context.Context, id uuid.UUID) (*Session, error)
	GetMany(ctx context.Context, where *WhereDto) ([]Session, error)
	UpdateOneById(ctx context.Context, id uuid.UUID, data UpdateDto) (*Session, error)
}

type Session struct {
	SessionID         uuid.UUID `json:"sessionId"`
	UserID            uuid.UUID `json:"userId"`
	Title             string    `json:"title"`
	IsMarkedCompleted bool      `json:"isMarkedCompleted"`
	IsArchived        bool      `json:"isArchived"`
	CreatedAt         time.Time `json:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
}

type CreateDto struct {
	UserID            uuid.UUID `json:"userId"`
	Title             *string   `json:"title"`
	IsMarkedCompleted *bool     `json:"isMarkedCompleted"`
}

type WhereDto struct {
	UserID            *filter.UuidFilter       `json:"userId"`
	IsMarkedCompleted *bool                    `json:"isMarkedCompleted"`
	IsArchived        *bool                    `json:"isArchived"`
	Sort              *filter.SortFilter       `json:"sort"`
	Pagination        *filter.PaginationFilter `json:"pagination"`
}

type UpdateDto struct {
	UserID            *uuid.UUID `json:"userId"`
	Title             *string    `json:"title"`
	IsMarkedCompleted *bool      `json:"isMarkedCompleted"`
	IsArchived        *bool      `json:"isArchived"`
}
