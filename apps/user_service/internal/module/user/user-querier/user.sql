-- name: CreateOne :one
INSERT INTO users (name, email, professional_role, llm_preferences, created_at, updated_at)
VALUES ($1, $2, $3, $4, NOW(), NOW())
RETURNING *;

-- name: GetOneById :one
SELECT * FROM users
WHERE id = $1;

-- name: UpdateOneById :one
UPDATE users SET
  name = coalesce(sqlc.narg(name), name),
  email = coalesce(sqlc.narg(email), email),
  professional_role = coalesce(sqlc.narg(professional_role), professional_role),
  llm_preferences = coalesce(sqlc.narg(llm_preferences), llm_preferences),
  updated_at = now()
WHERE id = sqlc.arg(id) RETURNING *;

-- name: GetAll :many
SELECT * FROM users
ORDER BY created_at ASC;

-- name: DeleteOne :execrows
DELETE FROM users
WHERE id = $1;