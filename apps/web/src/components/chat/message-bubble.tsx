import { useState } from 'react'
import { ChevronDown, ChevronRight, Wrench, Check, ListTodo, Circle, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import type { ChatMessage, ToolCallDisplay } from '@/types/chat'

// ─── Human Message Bubble ───

interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div className="flex gap-3 flex-row-reverse">
      <div className="min-w-0 max-w-[85%] text-right">
        <div className="inline-block rounded-2xl rounded-tr-sm border border-input bg-card px-4 py-2.5 text-body text-card-foreground shadow-sm transition-transform">
          {message.content}
        </div>
      </div>
    </div>
  )
}

// ─── Types ───

interface TodoItem {
  id: string
  task: string
  category?: string
  status: string
}

// id → todo lookup from agentState.todos
type StateTodoMap = Record<string, { task: string; category?: string; status?: string }>

// ─── Merge all todo tool calls into a single ordered list ───
// Process tools in order: write_todos seeds the map, update_todos patches statuses.

function mergeTodos(todoTools: ToolCallDisplay[], stateTodos: StateTodoMap): TodoItem[] {
  // Build a reverse lookup: task text → stateEntry (for ID resolution)
  const byTask = new Map<string, { id: string; task: string; category?: string; status?: string }>()
  for (const [id, entry] of Object.entries(stateTodos)) {
    byTask.set(entry.task, { id, ...entry })
  }

  const order: string[] = []
  const map = new Map<string, TodoItem>()

  for (const tool of todoTools) {
    const raw = tool.args as Record<string, unknown>
    const items = (raw?.items ?? raw?.todos ?? raw?.tasks ?? null)
    if (!Array.isArray(items)) continue

    const isWrite = tool.name.includes('write') || tool.name.includes('create') || tool.name.includes('add') || tool.name.includes('set')

    for (let i = 0; i < items.length; i++) {
      const item = items[i] as Record<string, unknown>

      if (isWrite) {
        // write_todos: { task, category } — no ID in args (generated server-side)
        const task = String(item.task ?? item.title ?? item.text ?? item.name ?? '')
        // Look up the real server-assigned ID from stateTodos by task text
        const stateEntry = byTask.get(task)
        const id = stateEntry?.id ?? `write-${i}`
        if (!map.has(id)) order.push(id)
        map.set(id, {
          id,
          task: task || stateEntry?.task || id,
          category: String(item.category ?? stateEntry?.category ?? '') || undefined,
          // Use stateTodos status (reflects latest updates) rather than initial 'pending'
          status: stateEntry?.status ?? String(item.status ?? 'pending'),
        })
      } else {
        // update_todos: { task_id, status } — look up task text from stateTodos
        const id = String(item.task_id ?? item.id ?? String(i))
        const stateEntry = stateTodos[id]
        const existing = map.get(id)
        if (!map.has(id)) order.push(id)
        map.set(id, {
          id,
          task: existing?.task ?? stateEntry?.task ?? id,
          category: existing?.category ?? stateEntry?.category,
          status: String(item.status ?? existing?.status ?? stateEntry?.status ?? 'pending'),
        })
      }
    }
  }

  return order.map(id => map.get(id)!).filter(Boolean)
}

// ─── Status config ───

const statusConfig: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  done:        { label: 'Done',        icon: <CheckCircle2 className="h-3.5 w-3.5" />, cls: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800/50' },
  complete:    { label: 'Done',        icon: <CheckCircle2 className="h-3.5 w-3.5" />, cls: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800/50' },
  in_progress: { label: 'In progress', icon: <Clock className="h-3.5 w-3.5" />,         cls: 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/40 dark:border-blue-800/50' },
  blocked:     { label: 'Blocked',     icon: <AlertCircle className="h-3.5 w-3.5" />,   cls: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-800/50' },
  pending:     { label: 'Pending',     icon: <Circle className="h-3.5 w-3.5" />,         cls: 'text-muted-foreground bg-secondary border-border' },
}

function getStatus(s?: string) {
  if (!s) return statusConfig.pending
  return statusConfig[s.toLowerCase()] ?? statusConfig.pending
}

// ─── Unified Todo Card (renders once for all todo tool calls in a group) ───

function TodoCard({ todoTools, stateTodos }: { todoTools: ToolCallDisplay[]; stateTodos: StateTodoMap }) {
  const [open, setOpen] = useState(true)
  const todos = mergeTodos(todoTools, stateTodos)
  if (todos.length === 0) return null

  const doneCount = todos.filter(t => t.status === 'done' || t.status === 'complete').length

  return (
    <div className="todo-card motion-soft-in">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="todo-card-header"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="todo-card-icon">
            <ListTodo className="h-3.5 w-3.5" />
          </div>
          <span className="todo-card-title">Tasks</span>
          <span className="todo-card-count">
            {doneCount}/{todos.length}
          </span>
        </div>
        <span className="todo-card-chevron">
          {open
            ? <ChevronDown className="h-3.5 w-3.5" />
            : <ChevronRight className="h-3.5 w-3.5" />
          }
        </span>
      </button>

      {open && (
        <div className="todo-card-body">
          {/* Progress bar */}
          {todos.length > 1 && (
            <div className="todo-progress-track">
              <div
                className="todo-progress-fill"
                style={{ width: `${Math.round((doneCount / todos.length) * 100)}%` }}
              />
            </div>
          )}

          <ul className="todo-list">
            {todos.map((todo, i) => {
              const s = getStatus(todo.status)
              return (
                <li key={todo.id ?? i} className="todo-item">
                  <div className="todo-item-body">
                    <span className="todo-item-title">
                      {todo.task || <span className="italic text-muted-foreground">Untitled</span>}
                    </span>
                    {todo.category && (
                      <span className="todo-item-desc">{todo.category}</span>
                    )}
                  </div>
                  <span className={`todo-status-badge ${s.cls}`}>
                    {s.icon}
                    {s.label}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Tool Chain Group ───

const TODO_TOOLS = new Set(['write_todos', 'update_todos', 'create_todos', 'update_todo', 'create_todo', 'add_todos', 'set_todos'])

export function ToolChainGroup({
  tools,
  isRunning,
  stateTodos = {},
}: {
  tools: ToolCallDisplay[]
  isRunning: boolean
  stateTodos?: StateTodoMap
}) {
  const [expanded, setExpanded] = useState(false)

  const todoTools = tools.filter(t => TODO_TOOLS.has(t.name))
  const regularTools = tools.filter(t => !TODO_TOOLS.has(t.name))

  const summaryText = isRunning
    ? 'Planning next steps'
    : regularTools.length === 1
      ? `Used ${regularTools[0].name} tool`
      : regularTools.length > 1
        ? `Used ${regularTools.length} tools`
        : null

  return (
    <div className="flex flex-col gap-2">
      {/* Regular tools collapsible */}
      {regularTools.length > 0 && summaryText && (
        <div className="tool-chain-group">
          <button
            onClick={() => setExpanded(!expanded)}
            className={`tool-chain-header ${isRunning ? 'tool-chain-header--running' : 'tool-chain-header--done'}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {expanded
                ? <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
                : <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
              }
              <span className={`tool-chain-summary ${isRunning ? 'tool-chain-shimmer' : ''}`}>
                {summaryText}
              </span>
            </div>
          </button>

          {expanded && (
            <div className="tool-chain-list">
              {regularTools.map(tc => (
                <ToolCallItem key={tc.id} tool={tc} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Single merged todo card */}
      {todoTools.length > 0 && (
        <TodoCard todoTools={todoTools} stateTodos={stateTodos} />
      )}
    </div>
  )
}

// ─── Individual Tool Call Item ───

function ToolCallItem({ tool }: { tool: ToolCallDisplay }) {
  const [detailOpen, setDetailOpen] = useState(false)
  const isRunning = tool.status === 'running'

  return (
    <div className="tool-call-item">
      <button
        onClick={() => setDetailOpen(!detailOpen)}
        className="tool-call-name-btn"
      >
        <div className="flex items-center gap-2 min-w-0">
          {isRunning
            ? <span className="tool-call-status-dot tool-call-status-dot--running" />
            : <Check className="h-3 w-3 text-muted-foreground/60 flex-shrink-0" />
          }
          <Wrench className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
          <span className="tool-call-name">{tool.name}</span>
        </div>
        {(Object.keys(tool.args).length > 0 || tool.output) && (
          detailOpen
            ? <ChevronDown className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />
            : <ChevronRight className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />
        )}
      </button>

      {detailOpen && (
        <div className="tool-call-detail">
          {Object.keys(tool.args).length > 0 && (
            <div className="tool-call-detail-section">
              <span className="tool-call-detail-label">Arguments</span>
              <pre className="tool-call-detail-pre">
                {JSON.stringify(tool.args, null, 2)}
              </pre>
            </div>
          )}
          {tool.output && (
            <div className="tool-call-detail-section">
              <span className="tool-call-detail-label">Response</span>
              <pre className="tool-call-detail-pre tool-call-detail-pre--response">
                {tool.output.slice(0, 800)}
                {tool.output.length > 800 && '…'}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
