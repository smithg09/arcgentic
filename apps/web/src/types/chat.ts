// ─── Chat UI Types ───

export interface ChatMessage {
  id: string
  role: 'human' | 'assistant' | 'tool' | 'system'
  content: string
  timestamp: Date
  toolCalls?: ToolCallDisplay[]
  isStreaming?: boolean
}

export interface ToolCallDisplay {
  id: string
  name: string
  args: Record<string, unknown>
  status: 'running' | 'complete' | 'error'
  output?: string
}

export interface StreamState {
  isStreaming: boolean
  currentNode: string | null
  error: string | null
}

// ─── SSE Event Types ───

export type SSEEventType =
  | 'token'
  | 'tool_start'
  | 'tool_end'
  | 'tool_call_chunk'
  | 'node_start'
  | 'heartbeat'
  | 'complete'
  | 'error'

export interface SSEEvent {
  type: SSEEventType
  data: Record<string, unknown>
}

export interface TokenEvent {
  content: string
}

export interface ToolStartEvent {
  tool: string
  input: unknown
}

export interface ToolEndEvent {
  tool: string
  output: string
  input?: unknown
}

export interface NodeStartEvent {
  node: string
}

export interface CompleteEvent {
  state: Record<string, unknown>
}

export interface ErrorEvent {
  message: string
}
