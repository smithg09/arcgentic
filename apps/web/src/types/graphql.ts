// ─── GraphQL Types ───

export interface User {
  id: string
  name: string
  email: string
  professional_role: string
  llm_preferences: string
  created_at: string
  updated_at: string
}

export interface Session {
  session_id: string
  user_id: string
  title: string
  is_marked_completed: boolean
  created_at: string
  updated_at: string
}

export interface EarnedSkill {
  user_id: string
  skills: string[]
  session_ids: string[]
  created_at: string
  updated_at: string
}

// ─── DTOs ───

export interface CreateUserDto {
  name: string
  email: string
  professional_role: string
  llm_preferences?: string
}

export interface CreateSessionDto {
  user_id: string
  title?: string
  is_marked_completed?: boolean
}

export interface UpdateSessionDto {
  user_id?: string
  title?: string
  is_marked_completed?: boolean
}

// ─── GraphQL Responses ───

export interface GqlResponse<T> {
  data: T
  errors?: Array<{ message: string }>
}
