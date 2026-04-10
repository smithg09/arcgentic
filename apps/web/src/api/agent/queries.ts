import { AGENT_API_BASE } from '@/lib/constants'
import type { AgentState } from '@/types/agent'

export async function getSessionState(sessionId: string): Promise<AgentState> {
  const res = await fetch(`${AGENT_API_BASE}/sessions/${sessionId}`)
  if (!res.ok) throw new Error(`Failed to get session state: ${res.status}`)
  return res.json()
}

export async function getResources(sessionId: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${AGENT_API_BASE}/sessions/${sessionId}/resources`)
  if (!res.ok) throw new Error(`Failed to get resources: ${res.status}`)
  return res.json()
}

export async function getResource(sessionId: string, type: string): Promise<unknown> {
  const res = await fetch(`${AGENT_API_BASE}/sessions/${sessionId}/resources/${type}`)
  if (!res.ok) throw new Error(`Failed to get resource: ${res.status}`)
  return res.json()
}

export async function addSources(sessionId: string, formData: FormData): Promise<any> {
  const res = await fetch(`${AGENT_API_BASE}/sessions/${sessionId}/sources`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error(`Failed to add sources: ${res.status}`)
  return res.json()
}
