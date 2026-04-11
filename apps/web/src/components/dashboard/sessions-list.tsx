import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listSessions } from '@/api/graphql/queries';
import { updateSession } from '@/api/graphql/mutations';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Filter,
  ArrowUpDown,
  LayoutGrid,
  List,
  Clock,
  CheckCircle2,
  Circle,
  MoreHorizontal
} from 'lucide-react';
import type { Session } from '@/types/graphql';

interface SessionsListProps {
  userId: string;
  onSessionClick: (sessionId: string) => void;
}

type FilterType = 'all' | 'active' | 'completed';
type SortType = 'newest' | 'oldest';
type LayoutType = 'list' | 'card';

export function SessionsList({ userId, onSessionClick }: SessionsListProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('newest');
  const [layout, setLayout] = useState<LayoutType>('card');

  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions', userId],
    queryFn: () =>
      listSessions({
        user_id: { eq: userId },
        sort: { sortBy: 'created_at', sortOrder: 'desc' }
      }),
    enabled: !!userId
  });

  const markComplete = useMutation({
    mutationFn: (id: string) => updateSession(id, { is_marked_completed: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] })
  });

  const filtered = useMemo(() => {
    let result = [...sessions];

    if (filter === 'active') result = result.filter((s) => !s.is_marked_completed);
    if (filter === 'completed') result = result.filter((s) => s.is_marked_completed);

    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sort === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [sessions, filter, sort]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-18 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (sessions.length === 0) return null;

  return (
    <div className="animate-in-up" style={{ animationDelay: '500ms' }}>
      {/* Section header — overline style */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-overline text-muted-foreground">
            Recent Sessions
          </h2>
          <span className="text-caption text-muted-foreground/50 font-normal">
            {filtered.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md">
                <Filter className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilter('all')}>
                <Circle className="h-3.5 w-3.5 mr-2" /> All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('active')}>
                <Clock className="h-3.5 w-3.5 mr-2" /> Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('completed')}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Completed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md">
                <ArrowUpDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSort('newest')}>Newest first</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSort('oldest')}>Oldest first</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md"
            onClick={() => setLayout((l) => (l === 'list' ? 'card' : 'list'))}
          >
            {layout === 'list' ? (
              <LayoutGrid className="h-3.5 w-3.5" />
            ) : (
              <List className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {layout === 'list' ? (
        <div className="space-y-1">
          {filtered.map((session, idx) => (
            <SessionListItem
              key={session.session_id}
              session={session}
              index={idx}
              onClick={() => onSessionClick(session.session_id)}
              onMarkComplete={() => markComplete.mutate(session.session_id)}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
          {filtered.map((session, idx) => (
            <SessionCardItem
              key={session.session_id}
              session={session}
              index={idx}
              onClick={() => onSessionClick(session.session_id)}
              onMarkComplete={() => markComplete.mutate(session.session_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SessionListItem({
  session,
  index,
  onClick,
  onMarkComplete
}: {
  session: Session;
  index: number;
  onClick: () => void;
  onMarkComplete: () => void;
}) {
  const date = new Date(session.created_at);
  const title = session.title || 'Untitled Session';

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      style={{ animationDelay: `${520 + index * 50}ms` }}
      className="group animate-in-up flex w-full items-center justify-between rounded-lg px-3 py-3 text-left
        hover:bg-secondary/60 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0">
          {session.is_marked_completed ? (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground/30" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-body text-foreground line-clamp-1 font-medium">{title}</p>
          <p className="mt-0.5 text-caption text-muted-foreground">
            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!session.is_marked_completed && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onMarkComplete();
              }}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Mark complete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function SessionCardItem({
  session,
  index,
  onClick,
  onMarkComplete
}: {
  session: Session;
  index: number;
  onClick: () => void;
  onMarkComplete: () => void;
}) {
  const date = new Date(session.created_at);
  const title = session.title || 'Untitled Session';

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      style={{ animationDelay: `${520 + index * 50}ms` }}
      className="group animate-in-up relative rounded-xl border border-border/60 bg-card p-5 text-left
        hover:bg-secondary/40 hover:-translate-y-1 hover:shadow-md hover:border-border
        active:translate-y-0 active:scale-[0.99]
        transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between min-h-[120px]"
    >
      <div className="mb-4 flex items-start justify-between w-full">
        <div className="flex items-center gap-2">
          {session.is_marked_completed ? (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground/30" />
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 rounded-md opacity-0 group-hover:opacity-100 transition-all -mt-1 -mr-1"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!session.is_marked_completed && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkComplete();
                }}
              >
                Mark complete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div>
        <p className="mb-2 text-body font-medium text-foreground line-clamp-2 leading-snug">{title}</p>
        <div className="flex items-center gap-2">
          <span className="text-caption text-muted-foreground">
            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          {session.is_marked_completed && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary">
              Done
            </span>
          )}
        </div>
      </div>

      <div
        className={`absolute inset-x-0 bottom-0 h-1 rounded-b-xl ${session.is_marked_completed ? 'bg-primary/60' : 'bg-primary/10'}`}
      />
    </div>
  );
}
