import { useState, useEffect, useRef, useCallback } from 'react'
import { AGENT_API_BASE } from '@/lib/constants'
import type { ChatMessage, ToolCallDisplay, BuilderStatus } from '@/types/chat'

interface UseBuilderStreamOptions {
  sessionId: string
  enabled: boolean
  onResourceReady?: (key: string) => void
  onComplete?: () => void
}

export function useBuilderStream({ sessionId, enabled, onResourceReady, onComplete }: UseBuilderStreamOptions) {
  const [builderStatus, setBuilderStatus] = useState<BuilderStatus>({
    status: 'idle',
    resources_ready: [],
    build_id: null,
  })
  
  const [builderMessages, setBuilderMessages] = useState<ChatMessage[]>([])
  const abortRef = useRef<AbortController | null>(null)
  const streamingContentRef = useRef('')
  const eventCursorRef = useRef(0)
  
  const aiMsgIdRef = useRef(crypto.randomUUID())

  const handleEvent = useCallback((event: { type: string;[key: string]: unknown }) => {
    const aiMsgId = aiMsgIdRef.current
    
    switch (event.type) {
      case 'token': {
        const content = (event.content as string) || ''
        streamingContentRef.current += content
        setBuilderMessages(prev =>
          prev.map(m =>
            m.id === aiMsgId ? { ...m, content: streamingContentRef.current } : m
          )
        )
        break
      }
      case 'tool_start': {
        const toolCall: ToolCallDisplay = {
          id: crypto.randomUUID(),
          name: event.tool as string,
          args: (event.input as Record<string, unknown>) || {},
          status: 'running',
        }
        setBuilderMessages(prev =>
          prev.map(m =>
            m.id === aiMsgId
              ? { ...m, toolCalls: [...(m.toolCalls || []), toolCall] }
              : m
          )
        )
        break
      }
      case 'tool_end': {
        const toolName = event.tool as string
        setBuilderMessages(prev =>
          prev.map(m => {
            if (m.id !== aiMsgId) return m
            const toolCalls = m.toolCalls?.map(tc =>
              tc.name === toolName && tc.status === 'running'
                ? { ...tc, status: 'complete' as const, output: event.output as string }
                : tc
            )
            return { ...m, toolCalls }
          })
        )
        break
      }
      case 'resource_ready': {
        const key = event.key as string
        setBuilderStatus(prev => ({
          ...prev,
          resources_ready: [...prev.resources_ready, key]
        }))
        onResourceReady?.(key)
        break
      }
      case 'builder_complete': {
        setBuilderStatus(prev => ({ ...prev, status: 'completed' }))
        setBuilderMessages(prev =>
          prev.map(m =>
            m.id === aiMsgId ? { ...m, isStreaming: false } : m
          )
        )
        onComplete?.()
        break
      }
      case 'builder_error': {
        setBuilderStatus(prev => ({
          ...prev,
          status: 'error',
          error: event.message as string
        }))
        setBuilderMessages(prev =>
          prev.map(m =>
            m.id === aiMsgId ? { ...m, isStreaming: false } : m
          )
        )
        onComplete?.()
        break
      }
    }
  }, [onResourceReady, onComplete])

  const connectStream = useCallback(async () => {
    if (!enabled) return

    setBuilderStatus(prev => ({ ...prev, status: 'running' }))
    
    setBuilderMessages(prev => {
      if (prev.find(m => m.id === aiMsgIdRef.current)) return prev
      return [{
        id: aiMsgIdRef.current,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
        toolCalls: [],
      }]
    })
    
    streamingContentRef.current = ''

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch(
        `${AGENT_API_BASE}/sessions/${sessionId}/build-stream?after=${eventCursorRef.current}`,
        { signal: controller.signal }
      )

      if (!res.ok) throw new Error(`Build stream failed: ${res.status}`)
      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue

          try {
            const event = JSON.parse(raw)
            handleEvent(event)
            eventCursorRef.current += 1
          } catch {
            // skip malformed
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      console.error('Builder stream error:', err)
    }
  }, [sessionId, enabled, handleEvent])

  useEffect(() => {
    if (enabled) {
      connectStream()
    } else {
      abortRef.current?.abort()
      setBuilderStatus(prev => ({ ...prev, status: 'idle' }))
      setBuilderMessages([])
      aiMsgIdRef.current = crypto.randomUUID()
      eventCursorRef.current = 0
      streamingContentRef.current = ''
    }
    return () => {
      abortRef.current?.abort()
    }
  }, [enabled, connectStream])

  return {
    builderStatus,
    builderMessages,
    isBuilding: builderStatus.status === 'running'
  }
}
