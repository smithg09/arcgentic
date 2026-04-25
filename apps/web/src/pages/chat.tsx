import { useEffect, useRef, useCallback, useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { getSessionState, getBuildStatus } from '@/api/agent/queries';
import { getSession } from '@/api/graphql/queries';
import { updateSession } from '@/api/graphql/mutations';
import { useSSE } from '@/hooks/use-sse';
import { useBuilderStream } from '@/hooks/use-builder-stream';
import { useModelSettings } from '@/hooks/use-model-settings';
import { ChatPanel } from '@/components/chat/chat-panel';
import { ContentPanel } from '@/components/content/content-panel';
import { getAndClearPendingFiles, getAndClearPendingUrls } from '@/lib/pending-uploads';
import type { AgentState } from '@/types/agent';
import type { ChatMessage } from '@/types/chat';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@arcgentic/ui/button';
import { useMediaQuery } from '@/hooks/use-media-query';

export function ChatPage() {
  const { sessionId } = useParams({ from: '/chat/$sessionId' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isDesktop = useMediaQuery('(min-width: 724px)');
  const { openSettings } = useModelSettings();

  // GraphQL Session
  const { data: session } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSession(sessionId)
  });

  // Agent state
  const { data: agentState, isLoading: stateLoading, isFetching: stateFetching } = useQuery({
    queryKey: ['agentState', sessionId],
    queryFn: () => getSessionState(sessionId),
    refetchOnWindowFocus: false
  });

  // Builder Status (on load)
  const { data: initialBuildStatus } = useQuery({
    queryKey: ['buildStatus', sessionId],
    queryFn: () => getBuildStatus(sessionId),
    refetchOnWindowFocus: false
  });

  // SSE
  const { messages, setMessages, streamState, builderId, sendMessage, stopStream } = useSSE({
    sessionId,
    onComplete: (state) => {
      // Refresh agent state and session list
      queryClient.invalidateQueries({ queryKey: ['agentState', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });

      // Update session title if we have spec.topic or human message
      const agentStateResp = state as unknown as AgentState;
      let title = agentStateResp?.spec?.topic;

      const agentMessages = agentStateResp?.messages;
      if (!title && agentMessages && agentMessages.length > 0) {
        const firstHumanMsg = agentMessages.find((m) => m.type === 'human');
        if (firstHumanMsg && typeof firstHumanMsg.content === 'string') {
          title =
            firstHumanMsg.content.length > 80
              ? firstHumanMsg.content.slice(0, 77) + '...'
              : firstHumanMsg.content;
        }
      }

      if (title && session?.title !== title) {
        updateSession(sessionId, { title }).catch(() => { });
      }
    },
    onNoProvider: (message) => {
      openSettings(message);
    },
  });

  const handleResourceReady = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['agentState', sessionId] });
  }, [queryClient, sessionId]);

  const handleBuildComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['agentState', sessionId] });
    queryClient.invalidateQueries({ queryKey: ['sessions'] });
    queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
  }, [queryClient, sessionId]);

  const rawActiveBuildId = builderId || (initialBuildStatus?.status === 'running' ? initialBuildStatus.build_id : null);

  // Track builds we've successfully hydrated to prevent duplicate messages
  const [clearedBuildIds, setClearedBuildIds] = useState<Set<string>>(new Set());
  const activeBuildId = rawActiveBuildId && !clearedBuildIds.has(rawActiveBuildId) ? rawActiveBuildId : null;

  // Builder Stream
  const { builderMessages, isBuilding } = useBuilderStream({
    sessionId,
    enabled: !!activeBuildId,
    onResourceReady: handleResourceReady,
    onComplete: handleBuildComplete
  });

  // Sync title from spec to session if needed (e.g. from GraphQL query load)
  useEffect(() => {
    if (agentState?.spec?.topic && session && session.title !== agentState.spec.topic) {
      updateSession(sessionId, { title: agentState.spec.topic })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
          queryClient.invalidateQueries({ queryKey: ['sessions'] });
        })
        .catch(() => { });
    }
  }, [agentState?.spec?.topic, session, sessionId, queryClient]);

  // Keep track of streaming state safely
  const isStreamingRef = useRef(streamState.isStreaming);
  useEffect(() => {
    isStreamingRef.current = streamState.isStreaming;
  }, [streamState.isStreaming]);

  // Hydrate messages from agent state
  useEffect(() => {
    if (!agentState?.messages) return;
    if (isStreamingRef.current) return;

    const hydrated: ChatMessage[] = [];

    for (let i = 0; i < agentState.messages.length; i++) {
      const m = agentState.messages[i];
      // In python we explicitly set role to user/assistant/tool/system
      const role =
        m.role ||
        (m.type === 'human'
          ? 'human'
          : m.type === 'tool'
            ? 'tool'
            : m.type === 'system'
              ? 'system'
              : 'assistant');

      let content = m.content;
      if (typeof content !== 'string') {
        try {
          content = JSON.stringify(content, null, 2);
        } catch {
          content = String(content);
        }
      }

      if (role === 'tool') {
        // Group tool message outputs into the preceding assistant message
        const lastAiIndex = hydrated
          .slice()
          .reverse()
          .findIndex((msg) => msg.role === 'assistant');
        if (lastAiIndex !== -1) {
          const actualIndex = hydrated.length - 1 - lastAiIndex;
          const lastAi = hydrated[actualIndex];
          if (lastAi.toolCalls) {
            const tc = lastAi.toolCalls.find((t) => t.id === m.tool_call_id || t.name === m.name);
            if (tc) {
              tc.status = 'complete';
              tc.output = content;
              continue; // skip pushing a separate tool bubble
            }
          }
        }
        // Fallback: push as individual message if no mapping found
        hydrated.push({
          id: `hydrated-${i}`,
          role: 'tool',
          content,
          timestamp: new Date()
        });
      } else {
        hydrated.push({
          id: `hydrated-${i}`,
          role: role as ChatMessage['role'],
          content,
          timestamp: new Date(),
          toolCalls:
            m.tool_calls?.map((tc) => ({
              id: tc.id,
              name: tc.name,
              args: tc.args || {},
              status: 'complete',
              output: undefined
            })) || []
        });
      }
    }

    if (hydrated.length > 0) {
      setMessages(hydrated);
    }
  }, [agentState?.messages, setMessages]);

  // Safely clear the builder stream AFTER the new agent state is fetched
  // This prevents the duplicate message while avoiding a flicker
  useEffect(() => {
    if (rawActiveBuildId && !isBuilding && !stateFetching && builderMessages.length > 0) {
      setClearedBuildIds(prev => new Set(prev).add(rawActiveBuildId));
    }
  }, [rawActiveBuildId, isBuilding, stateFetching, builderMessages.length]);

  // Send initial message if navigated from dashboard
  useEffect(() => {
    const initialMessage = localStorage.getItem('pending_message');
    if (initialMessage && messages.length === 0 && !streamState.isStreaming) {
      // Small delay to let the component mount
      const timer = setTimeout(() => {
        // Read & clear pending data inside the timer so React Strict Mode's
        // double-invocation doesn't consume them before the timer fires.
        const pendingFiles = getAndClearPendingFiles();
        const pendingUrls = getAndClearPendingUrls();

        sendMessage(
          initialMessage,
          pendingFiles.length > 0 ? pendingFiles : undefined,
          pendingUrls.length > 0 ? pendingUrls : undefined
        );
        localStorage.removeItem('pending_message');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-[calc(100vh-3.5rem)] min-h-0 flex-col motion-hero">
      {/* Header bar */}
      <div className="bg-background border-b border-border/40 z-10 shrink-0 w-full">
        <div className="flex h-[44px] items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 -ml-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
              onClick={() => navigate({ to: '/' })}
            >
              <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2} />
            </Button>
            <div className="h-4 w-px bg-border/60 mx-1" />
            <span className="font-sans text-sm font-medium truncate text-foreground/80 px-1">
              {agentState?.spec?.topic || session?.title || `${sessionId.slice(0, 8)}...`}
            </span>
          </div>
        </div>
      </div>

      {isBuilding && (
        <div className="bg-primary/5 border-b border-primary/20 px-4 py-2 text-xs font-medium text-primary flex items-center justify-center gap-2">
          <div className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Builder is working in the background...
        </div>
      )}

      {/* Panels */}
      <PanelGroup
        orientation={isDesktop ? 'horizontal' : 'vertical'}
        className="flex-1 min-h-0 bg-background"
      >
        <Panel
          defaultSize={"40%"}
          minSize={"30%"}
        >
          <ChatPanel
            messages={[...messages, ...builderMessages]}
            streamState={{
              ...streamState,
              isStreaming: streamState.isStreaming || isBuilding
            }}
            onSend={sendMessage}
            onStop={stopStream}
            stateTodos={agentState?.todos ?? []}
          />
        </Panel>

        <PanelResizeHandle
          className={
            isDesktop
              ? 'group w-2 hover:bg-muted/40 cursor-col-resize flex flex-col items-center justify-center gap-1 z-10 transition-colors duration-200'
              : 'group h-2 hover:bg-muted/40 cursor-row-resize flex flex-row items-center justify-center gap-1 z-10 transition-colors duration-200'
          }
        >
          <div
            className={
              isDesktop
                ? 'h-8 w-[3px] rounded-full bg-border/50 group-hover:bg-primary/40 transition-colors'
                : 'w-8 h-[3px] rounded-full bg-border/50 group-hover:bg-primary/40 transition-colors'
            }
          />
        </PanelResizeHandle>

        <Panel
          defaultSize={"70%"}
          minSize={"40%"}
          className="bg-background"
        >
          <ContentPanel
            agentState={agentState ?? null}
            isLoading={stateLoading}
            isBuilding={isBuilding}
          />
        </Panel>
      </PanelGroup>
    </div>
  );
}
