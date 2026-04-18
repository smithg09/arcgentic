// ─── Agent Service Types ───

export interface LearningSpec {
  topic: string
  experience_level: string
  focus_areas: string[]
  learning_goals: string[]
  preferred_depth: string
  source_summary: string
  is_ready: boolean
}

export interface Source {
  url: string
  type: string
  name: string
  content: string
  relevance: string
}

export interface ContentFile {
  path: string
  content: string
  size: number
}

export interface AgentTask {
  agent: string
  task: string
  status: string
  result: string
}

export interface AgentStateTodo {
  id: string
  task: string
  category?: string
  status?: 'pending' | 'in_progress' | 'done' | string
}

export interface AgentState {
  session_id: string
  exists: boolean
  messages: AgentMessage[]
  spec: LearningSpec | null
  sources: Source[]
  resources: Record<string, ContentFile>
  resources_count: number
  tasks: AgentTask[]
  current_agent: string
  todos: AgentStateTodo[]
}

export interface AgentMessage {
  type: 'human' | 'ai' | 'tool' | 'system'
  role?: string
  content: string
  name?: string
  tool_call_id?: string
  tool_calls?: ToolCall[]
}

export interface ToolCall {
  id: string
  name: string
  args: Record<string, unknown>
}
