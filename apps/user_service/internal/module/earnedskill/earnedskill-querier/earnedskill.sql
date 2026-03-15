-- name: GetOneByUserID :one
SELECT * FROM earned_skills
WHERE user_id = $1;

-- name: UpsertOne :one
INSERT INTO earned_skills (user_id, skills, session_ids, created_at, updated_at)
VALUES ($1, $2, $3, NOW(), NOW())
ON CONFLICT (user_id) DO UPDATE SET
  skills = EXCLUDED.skills,
  session_ids = EXCLUDED.session_ids,
  updated_at = NOW()
RETURNING *;