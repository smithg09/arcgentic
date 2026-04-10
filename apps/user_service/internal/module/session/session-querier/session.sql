-- name: CreateOne :one
INSERT INTO sessions (user_id, title, is_marked_completed, created_at, updated_at)
VALUES ($1, $2, $3, NOW(), NOW())
RETURNING *;

-- name: GetOneById :one
SELECT * FROM sessions
WHERE session_id = $1;

-- name: GetMany :many
SELECT *
FROM sessions
WHERE
  (
    (sqlc.narg('user_id_eq')::uuid IS NOT NULL AND user_id = sqlc.narg('user_id_eq'))
    OR
    (sqlc.narg('user_id_eq')::uuid IS NULL)
  )
  AND
  (
    (array_length(sqlc.narg('user_id_in')::uuid[], 1) > 0 AND user_id = ANY(sqlc.narg('user_id_in')::uuid[]))
    OR
    (array_length(sqlc.narg('user_id_in')::uuid[], 1) IS NULL)
  )
  AND
  (
    is_marked_completed = sqlc.narg('is_marked_completed') OR sqlc.narg('is_marked_completed') IS NULL
  )
ORDER BY
  CASE WHEN sqlc.narg('sort_query')::text = 'created_at__asc' THEN created_at END ASC,
  CASE WHEN sqlc.narg('sort_query')::text = 'created_at__desc' THEN created_at END DESC,
  CASE WHEN sqlc.narg('sort_query')::text = 'updated_at__asc' THEN updated_at END ASC,
  CASE WHEN sqlc.narg('sort_query')::text = 'updated_at__desc' THEN updated_at END DESC,
  CASE WHEN sqlc.narg('sort_query')::text = 'is_marked_completed__asc' THEN is_marked_completed END ASC,
  CASE WHEN sqlc.narg('sort_query')::text = 'is_marked_completed__desc' THEN is_marked_completed END DESC
LIMIT sqlc.narg('limit') OFFSET sqlc.narg('offset');

-- name: UpdateOneById :one
UPDATE sessions SET
  user_id = coalesce(sqlc.narg(user_id), user_id),
  title = coalesce(sqlc.narg(title), title),
  is_marked_completed = coalesce(sqlc.narg(is_marked_completed), is_marked_completed),
  updated_at = now()
WHERE session_id = sqlc.arg(id) RETURNING *;