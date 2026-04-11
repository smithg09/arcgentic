import { gqlFetch } from '@/lib/graphql-client'
import type { User, Session, EarnedSkill } from '@/types/graphql'

// ─── Users ───

export async function listUsers(): Promise<User[]> {
  const data = await gqlFetch<{ listUsers: User[] }>(`
    query ListUsers {
      listUsers {
        id
        name
        email
        professional_role
        llm_preferences
        created_at
        updated_at
      }
    }
  `)
  return data.listUsers
}

export async function getUser(id: string): Promise<User | null> {
  const data = await gqlFetch<{ getUser: User | null }>(`
    query GetUser($id: Uuid!) {
      getUser(id: $id) {
        id
        name
        email
        professional_role
        llm_preferences
        created_at
        updated_at
      }
    }
  `, { id })
  return data.getUser
}

// ─── Sessions ───

interface ListSessionsWhere {
  user_id?: { eq?: string; in?: string[] }
  is_marked_completed?: boolean
  is_archived?: boolean
  sort?: { sortBy: string; sortOrder: string }
  pagination?: { limit: number; skip: number }
}

export async function listSessions(where?: ListSessionsWhere): Promise<Session[]> {
  const data = await gqlFetch<{ listSessions: Session[] }>(`
    query ListSessions($where: WhereSessionsDto) {
      listSessions(where: $where) {
        session_id
        user_id
        title
        is_marked_completed
        is_archived
        created_at
        updated_at
      }
    }
  `, { where })
  return data.listSessions
}

export async function getSession(id: string): Promise<Session | null> {
  const data = await gqlFetch<{ getSession: Session | null }>(`
    query GetSession($id: Uuid!) {
      getSession(id: $id) {
        session_id
        user_id
        title
        is_marked_completed
        is_archived
        created_at
        updated_at
      }
    }
  `, { id })
  return data.getSession
}

// ─── Earned Skills ───

export async function getEarnedSkills(userId: string): Promise<EarnedSkill | null> {
  const data = await gqlFetch<{ getEarnedSkills: EarnedSkill | null }>(`
    query GetEarnedSkills($user_id: Uuid!) {
      getEarnedSkills(user_id: $user_id) {
        user_id
        skills
        session_ids
        created_at
        updated_at
      }
    }
  `, { user_id: userId })
  return data.getEarnedSkills
}
