import { gqlFetch } from '@/lib/graphql-client'
import type { User, Session, CreateUserDto, CreateSessionDto, UpdateSessionDto } from '@/types/graphql'

// ─── Users ───

export async function createUser(data: CreateUserDto): Promise<User> {
  const result = await gqlFetch<{ createUser: User }>(`
    mutation CreateUser($data: CreateUserDto!) {
      createUser(data: $data) {
        id
        name
        email
        professional_role
        llm_preferences
        created_at
        updated_at
      }
    }
  `, { data })
  return result.createUser
}

// ─── Sessions ───

export async function createSession(data: CreateSessionDto): Promise<Session> {
  const result = await gqlFetch<{ createSession: Session }>(`
    mutation CreateSession($data: CreateSessionDto!) {
      createSession(data: $data) {
        session_id
        user_id
        title
        is_marked_completed
        created_at
        updated_at
      }
    }
  `, { data })
  return result.createSession
}

export async function updateSession(id: string, data: UpdateSessionDto): Promise<Session> {
  const result = await gqlFetch<{ updateSession: Session }>(`
    mutation UpdateSession($id: Uuid!, $data: UpdateSessionDto!) {
      updateSession(id: $id, data: $data) {
        session_id
        user_id
        title
        is_marked_completed
        created_at
        updated_at
      }
    }
  `, { id, data })
  return result.updateSession
}
