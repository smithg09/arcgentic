import { User } from 'lucide-react'
import { useState } from 'react'
import { ChevronDown, ChevronRight, Wrench, Check } from 'lucide-react'
import type { ChatMessage, ToolCallDisplay } from '@/types/chat'

// ─── Human Message Bubble ───

interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div className="flex gap-3 flex-row-reverse">
      {/* Avatar */}
      {/* <div className="flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center bg-secondary">
        <User className="h-4 w-4 text-muted-foreground" />
      </div> */}

      {/* Content */}
      <div className="min-w-0 max-w-[85%] text-right">
        <div className="inline-block rounded-2xl rounded-tr-sm border border-input bg-card px-4 py-2.5 text-body text-card-foreground shadow-sm transition-transform">
          {message.content}
        </div>
      </div>
    </div>
  )
}

export function ToolChainGroup({ tools, isRunning }: { tools: ToolCallDisplay[], isRunning: boolean }) {
  const [expanded, setExpanded] = useState(false)

  const summaryText = isRunning
    ? 'Planning next steps'
    : tools.length === 1
      ? `Used ${tools[0].name} tool`
      : `Used ${tools.length} tools`

  return (
    <div className="tool-chain-group">
      {/* Top-level collapsible header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`tool-chain-header ${isRunning ? 'tool-chain-header--running' : 'tool-chain-header--done'}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
          )}
          <span className={`tool-chain-summary ${isRunning ? 'tool-chain-shimmer' : ''}`}>
            {summaryText}
          </span>
        </div>
      </button>

      {/* Expanded: list of tool names */}
      {expanded && (
        <div className="tool-chain-list">
          {tools.map(tc => (
            <ToolCallItem key={tc.id} tool={tc} />
          ))}
        </div>
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
          {isRunning ? (
            <span className="tool-call-status-dot tool-call-status-dot--running" />
          ) : (
            <Check className="h-3 w-3 text-muted-foreground/60 flex-shrink-0" />
          )}
          <Wrench className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
          <span className="tool-call-name">{tool.name}</span>
        </div>
        {(Object.keys(tool.args).length > 0 || tool.output) && (
          detailOpen ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />
          )
        )}
      </button>

      {/* Detail: args + response */}
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
