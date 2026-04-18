import { useRef, useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScrollArea } from '@arcgentic/ui/scroll-area';
import { MessageBubble, ToolChainGroup } from './message-bubble';
import { ChatInput } from './chat-input';
import type { ChatMessage, ToolCallDisplay, StreamState } from '@/types/chat';
import { Bot } from 'lucide-react';
import { WidgetFrameCode } from '../content/widgetFrame';

interface ChatPanelProps {
  messages: ChatMessage[];
  streamState: StreamState;
  onSend: (message: string, files?: File[], urls?: string[]) => void;
  onStop: () => void;
  /** Full todos list from agentState — used to enrich update_todos display */
  stateTodos?: Array<{ id: string; task: string; category?: string; status?: string }>;
}

// ─── Render segment types ───

type RenderSegment =
  | { type: 'tools'; tools: ToolCallDisplay[] }
  | { type: 'text'; content: string; isStreaming?: boolean }
  | { type: 'widget'; tool: ToolCallDisplay }
  | { type: 'thinking' };

// ─── Message grouping ───

interface MessageGroup {
  type: 'human' | 'assistant';
  messages: ChatMessage[];
}

function groupMessages(messages: ChatMessage[]): MessageGroup[] {
  const groups: MessageGroup[] = [];

  for (const msg of messages) {
    if (msg.role === 'human') {
      groups.push({ type: 'human', messages: [msg] });
    } else {
      // assistant, tool, system → merge into last assistant group
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.type === 'assistant') {
        lastGroup.messages.push(msg);
      } else {
        groups.push({ type: 'assistant', messages: [msg] });
      }
    }
  }

  return groups;
}

// ─── Build render segments from grouped messages ───
// Preserves chronological order: text → tools → text
// Assistant messages with only tool_calls (no content) are "invisible" —
// their tools get collected and flushed before the next text block.

function buildSegments(messages: ChatMessage[]): RenderSegment[] {
  const result: RenderSegment[] = [];
  let pendingTools: ToolCallDisplay[] = [];

  const flushTools = () => {
    if (pendingTools.length > 0) {
      result.push({ type: 'tools', tools: [...pendingTools] });
      pendingTools = [];
    }
  };

  for (const msg of messages) {
    // Skip standalone tool-role messages (their output is already on the assistant's toolCalls)
    if (msg.role === 'tool') continue;

    const widgetTools = msg.toolCalls?.filter((tc) => tc.name === 'show_widget') || [];
    const reasoningTools = msg.toolCalls?.filter((tc) => tc.name !== 'show_widget') || [];

    // Accumulate reasoning tools from this message
    if (reasoningTools.length > 0) {
      pendingTools.push(...reasoningTools);
    }

    const hasContent = msg.content && typeof msg.content === 'string' && msg.content.trim();

    // Text content → flush pending tools first, then show text
    if (hasContent) {
      flushTools();
      result.push({ type: 'text', content: msg.content as string, isStreaming: msg.isStreaming });
    }

    // Widgets → flush pending tools, then render widget iframes
    for (const wt of widgetTools) {
      if (wt.status === 'complete' && wt.args && typeof wt.args.widget_code === 'string') {
        flushTools();
        result.push({ type: 'widget', tool: wt });
      }
    }

    // Streaming placeholder: no content, no tools → "Thinking..."
    if (msg.isStreaming && !hasContent && reasoningTools.length === 0) {
      result.push({ type: 'thinking' });
    }
  }

  // Flush any remaining tools at the end (e.g. tools still running, no text yet)
  flushTools();

  return result;
}

// ─── Chat Panel ───

export function ChatPanel({ messages, streamState, onSend, onStop, stateTodos = [] }: ChatPanelProps) {
  // Build id→todo map — memoized so it's stable across renders
  const stateTodosMap = useMemo(
    () => Object.fromEntries(stateTodos.map(t => [t.id, t])),
    [stateTodos]
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const groups = useMemo(() => groupMessages(messages), [messages]);
  const [thinkingMessageIndex, setThinkingMessageIndex] = useState(0);

  const starterPrompts = useMemo(
    () => [
      'Draft a focused study plan for this topic.',
      'Summarize the key ideas from my uploaded sources.',
      'Quiz me with 5 progressive questions.'
    ],
    []
  );

  const thinkingMessages = useMemo(
    () => [
      'Mapping your sources and recent context...',
      'Assembling a concise next-best response...',
      'Checking for gaps before I answer...'
    ],
    []
  );

  // Handle cross-document messages from widget frames
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (data && data.jsonrpc === '2.0' && data.method) {
        if (data.method === 'ui/message') {
          const text = data.params?.content?.[0]?.text;
          if (typeof text === 'string' && onSend) {
            onSend(text);
          }
        } else if (data.method === 'ui/open-link') {
          const url = data.params?.url;
          if (typeof url === 'string') {
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSend]);

  // Auto-scroll to bottom on new messages
  // We use stringified streamState.isStreaming so that newly started streaming messages pull us down,
  // and when a message is completed, we snap to the bottom as well.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streamState.isStreaming]);

  useEffect(() => {
    if (!streamState.isStreaming) return;

    const timer = window.setInterval(() => {
      setThinkingMessageIndex((prev) => (prev + 1) % thinkingMessages.length);
    }, 2200);

    return () => window.clearInterval(timer);
  }, [streamState.isStreaming, thinkingMessages.length]);

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <ScrollArea className="flex-1 px-4 md:px-6">
        <div className="space-y-6 py-5 md:py-6">
          {messages.length === 0 && (
            <div className="motion-soft-in flex flex-col items-center justify-center py-16 text-center">
              <div className="motion-press mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/50 text-muted-foreground ring-1 ring-border">
                <Bot className="h-8 w-8" />
              </div>
              <p className="text-body text-muted-foreground max-w-sm mb-6">
                Start your session with a prompt, source, or goal.
              </p>
              <div className="mt-2 flex max-w-xl flex-wrap justify-center gap-2.5">
                {starterPrompts.map((prompt, idx) => (
                  <button
                    key={`starter-${idx}`}
                    onClick={() => onSend(prompt)}
                    className="motion-chip-in motion-press rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
          {groups.map((group, gi) =>
            group.type === 'human' ? (
              <MessageBubble key={`g-${gi}`} message={group.messages[0]} />
            ) : (
              <AssistantGroup
                key={`g-${gi}`}
                messages={group.messages}
                isStreaming={streamState.isStreaming && gi === groups.length - 1} // Only the last assistant group can be streaming
                thinkingLabel={thinkingMessages[thinkingMessageIndex]}
                stateTodosMap={stateTodosMap}
              />
            )
          )}
          <div ref={messagesEndRef} className="h-px" />
        </div>
      </ScrollArea>

      {/* Error */}
      {streamState.error && (
        <div className="motion-soft-in border-t border-destructive/20 bg-destructive/5 px-4 py-2.5 md:px-6">
          <p className="text-caption text-destructive">{streamState.error} Try sending again when ready.</p>
        </div>
      )}

      {/* Input */}
      <ChatInput onSend={onSend} onStop={onStop} isStreaming={streamState.isStreaming} />
    </div>
  );
}

// ─── Assistant Group: single avatar + merged segments ───

function AssistantGroup({
  messages,
  thinkingLabel,
  isStreaming,
  stateTodosMap,
}: {
  messages: ChatMessage[];
  thinkingLabel: string;
  isStreaming: boolean;
  stateTodosMap: Record<string, { task: string; category?: string; status?: string }>;
}) {
  const segments = useMemo(() => buildSegments(messages), [messages]);

  // Blinking cursor if the last message is actively streaming text
  const lastMsg = messages[messages.length - 1];
  const showCursor = isStreaming

  return (
    <div className="motion-soft-in flex gap-3.5">
      {/* Single avatar for the entire AI turn */}
      {/* <div className="flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center bg-transparent border border-border/50">
        <Sparkles className="h-4 w-4 text-foreground/70" />
      </div> */}

      {/* Render segments in chronological order */}
      <div className="min-w-0 max-w-[88%] space-y-3.5 md:max-w-[84%]">
        {segments.map((seg, i) => {
          switch (seg.type) {
            case 'tools':
              return (
                <ToolChainGroup
                  key={`seg-${i}`}
                  tools={seg.tools}
                  isRunning={Boolean(showCursor)}
                  stateTodos={stateTodosMap}
                />
              );
            case 'text':
              return (
                <div key={`seg-${i}`} className="inline-block px-4 py-2 pl-0 prose text-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{seg.content}</ReactMarkdown>
                </div>
              );
            case 'widget':
              return (
                <div
                  key={`seg-${i}`}
                  style={{ width: "115%" }}
                  className="motion-soft-in my-3 overflow-hidden rounded-xl border border-border bg-card shadow-sm ring-0"
                >
                  <WidgetFrameCode
                    widgetCode={(seg.tool.args.widget_code as string) || ''}
                    title={(seg.tool.args.title as string) || ''}
                  />
                </div>
              );
            case 'thinking':
              return (
                <div
                  key={`seg-${i}`}
                  className="motion-soft-in flex items-center gap-2 text-caption text-muted-foreground"
                >
                  <span className="tool-shimmer-dot" />
                  <span>{thinkingLabel}</span>
                </div>
              );
          }
        })}
        {showCursor && (
          <div className="typing-indicator motion-soft-in" aria-live="polite" aria-label="Assistant is typing">
            <span className="text-caption text-muted-foreground">Typing</span>
            <span className="typing-indicator-dots" aria-hidden="true">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
