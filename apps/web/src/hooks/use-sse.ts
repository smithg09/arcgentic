import { useState, useRef, useCallback } from 'react'
import { AGENT_API_BASE } from '@/lib/constants'
import { getStoredModelConfig, toApiModelConfig } from '@/hooks/use-model-settings'
import type { ChatMessage, ToolCallDisplay, StreamState } from '@/types/chat'

interface UseSSEOptions {
  sessionId: string
  onComplete?: (state: Record<string, unknown>) => void
  onNoProvider?: (message: string) => void
}

export function useSSE({ sessionId, onComplete, onNoProvider }: UseSSEOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streamState, setStreamState] = useState<StreamState>({
    isStreaming: false,
    currentNode: null,
    error: null,
  })

  const abortRef = useRef<AbortController | null>(null)
  const streamingContentRef = useRef('')

  const sendMessage = useCallback(
    async (content: string, files?: File[], urls?: string[]) => {
      // Add human message immediately (optimistic)
      const humanMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'human',
        content,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, humanMsg])

      // Prepare streaming AI message
      const aiMsgId = crypto.randomUUID()
      const aiMsg: ChatMessage = {
        id: aiMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
        toolCalls: [],
      }
      setMessages(prev => [...prev, aiMsg])

      setStreamState({ isStreaming: true, currentNode: null, error: null })
      streamingContentRef.current = ''

      // Abort previous stream
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const formData = new FormData()
        formData.append('message', content)
        if (files) {
          files.forEach(f => formData.append('files', f))
        }
        if (urls && urls.length > 0) {
          formData.append('urls', urls.join(','))
        }

        // Attach model config from localStorage
        const storedConfig = getStoredModelConfig()
        if (storedConfig) {
          formData.append('model_config', JSON.stringify(toApiModelConfig(storedConfig)))
        }

        const res = await fetch(
          `${AGENT_API_BASE}/sessions/${sessionId}/chat`,
          {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          }
        )

        if (!res.ok) throw new Error(`Chat failed: ${res.status}`)
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
              handleEvent(event, aiMsgId)
            } catch {
              // skip malformed events
            }
          }
        }

        // Finalize AI message
        setMessages(prev =>
          prev.map(m =>
            m.id === aiMsgId
              ? { ...m, content: streamingContentRef.current, isStreaming: false }
              : m
          )
        )
        setStreamState({ isStreaming: false, currentNode: null, error: null })
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        const message = (err as Error).message || 'Stream failed'
        setStreamState({ isStreaming: false, currentNode: null, error: message })
        setMessages(prev =>
          prev.map(m =>
            m.id === aiMsgId
              ? { ...m, content: streamingContentRef.current || 'Error occurred', isStreaming: false }
              : m
          )
        )
      }
    },
    [sessionId, onComplete]
  )

  const handleEvent = useCallback(
    (event: { type: string;[key: string]: unknown }, aiMsgId: string) => {
      switch (event.type) {
        case 'token': {
          const content = (event.content as string) || ''
          streamingContentRef.current += content
          setMessages(prev =>
            prev.map(m =>
              m.id === aiMsgId ? { ...m, content: streamingContentRef.current } : m
            )
          )
          break
        }
        case 'node_start': {
          setStreamState(prev => ({ ...prev, currentNode: event.node as string }))
          break
        }
        case 'tool_start': {
          const toolCall: ToolCallDisplay = {
            id: crypto.randomUUID(),
            name: event.tool as string,
            args: (event.input as Record<string, unknown>) || {},
            status: 'running',
          }
          setMessages(prev =>
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
          setMessages(prev =>
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
        case 'complete': {
          onComplete?.(event.state as Record<string, unknown>)
          break
        }
        case 'error': {
          const errorCode = event.code as string | undefined
          const errorMsg = (event.message as string) || 'Unknown error'
          if (errorCode === 'NO_PROVIDER' || errorCode === 'INVALID_API_KEY') {
            onNoProvider?.(errorMsg)
          }
          setStreamState(prev => ({
            ...prev,
            error: errorMsg,
          }))
          break
        }
        // heartbeat — no action
      }
    },
    [onComplete]
  )

  const stopStream = useCallback(() => {
    abortRef.current?.abort()
    setStreamState({ isStreaming: false, currentNode: null, error: null })
  }, [])

  return {
    messages,
    setMessages,
    streamState,
    sendMessage,
    stopStream,
  }
}
