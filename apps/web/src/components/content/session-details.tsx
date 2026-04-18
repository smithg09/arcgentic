import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@arcgentic/ui/badge';
import {
  Globe,
  BookOpen,
  ExternalLink,
  FileText,
  Plus,
  Upload,
  Link as LinkIcon,
  Loader2,
  Target,
  Sparkles,
  GraduationCap,
  FolderOpenDot,
  X,
  ChevronRight,
} from 'lucide-react';
import type { AgentState, Source } from '@/types/agent';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@arcgentic/ui/dialog';
import { ScrollArea } from '@arcgentic/ui/scroll-area';
import { Button } from '@arcgentic/ui/button';
import { Input } from '@arcgentic/ui/input';
import { addSources } from '@/api/agent/queries';

interface SessionDetailsProps {
  agentState: AgentState | null;
}

export function SessionDetails({ agentState }: SessionDetailsProps) {
  const queryClient = useQueryClient();
  const spec = agentState?.spec;
  const sources = agentState?.sources || [];
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);

  const [isAddingSource, setIsAddingSource] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [hasFiles, setHasFiles] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentState?.session_id) return;
    if (!newUrl && !hasFiles) return;

    setIsUploading(true);
    const formData = new FormData();
    if (newUrl) formData.append('urls', newUrl);

    if (fileInputRef.current?.files) {
      Array.from(fileInputRef.current.files).forEach((file) => {
        formData.append('files', file);
      });
    }

    try {
      await addSources(agentState.session_id, formData);

      setNewUrl('');
      setHasFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsAddingSource(false);

      queryClient.invalidateQueries({ queryKey: ['agentState', agentState.session_id] });
    } catch (err) {
      console.error('Failed to upload source:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Sources ─────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <p className="text-overline text-muted-foreground">Sources</p>
            {sources.length > 0 && (
              <span className="inline-flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-primary/12 px-1.5 text-[10px] font-semibold text-primary tabular-nums">
                {sources.length}
              </span>
            )}
          </div>
          {!isAddingSource && (
            <button
              onClick={() => setIsAddingSource(true)}
              className="group inline-flex items-center gap-1 rounded-full border border-dashed border-border/70 bg-transparent px-2.5 py-0.5 text-caption text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
            >
              <Plus className="h-3 w-3 transition-transform group-hover:rotate-90" />
              Add
            </button>
          )}
        </div>

        {/* Source cards */}
        {sources.length > 0 ? (
          <div className="grid gap-2">
            {sources.map((source, i) => (
              <button
                key={i}
                onClick={() => setSelectedSource(source)}
                className="group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border border-border/60 bg-card/60 px-3.5 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-accent/25 hover:shadow-sm cursor-pointer"
              >
                {/* Color accent strip */}
                <span className="absolute left-0 top-0 h-full w-0.5 rounded-l-xl bg-primary/0 transition-all duration-200 group-hover:bg-primary/50" />

                {/* Icon */}
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground shadow-sm transition-colors duration-200 group-hover:border-primary/25 group-hover:text-primary">
                  <Globe className="h-3.5 w-3.5" />
                </div>

                {/* Label */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-medium text-foreground transition-colors group-hover:text-primary">
                    {source.name || source.url}
                  </p>
                  {source.relevance && (
                    <p className="mt-0.5 line-clamp-1 text-caption text-muted-foreground">
                      {source.relevance}
                    </p>
                  )}
                </div>

                {/* Arrow */}
                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary/60" />
              </button>
            ))}
          </div>
        ) : (
          !isAddingSource && (
            <div className="flex flex-col items-center gap-2.5 rounded-xl border border-dashed border-border/60 bg-card/30 py-6 text-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/50 text-muted-foreground/50">
                <FolderOpenDot className="h-4 w-4" />
              </div>
              <div>
                <p className="text-body text-muted-foreground">No sources yet</p>
                <p className="text-caption text-muted-foreground/60">
                  Add a URL or file to ground the agent in your material.
                </p>
              </div>
              <button
                onClick={() => setIsAddingSource(true)}
                className="mt-0.5 inline-flex items-center gap-1.5 rounded-full border border-dashed border-border bg-background px-3 py-1 text-caption text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                <Plus className="h-3 w-3" />
                Add a source
              </button>
            </div>
          )
        )}

        {/* Add-source inline form */}
        {isAddingSource && (
          <form
            onSubmit={handleAddSource}
            className="space-y-3 rounded-xl border border-border/80 bg-card/60 p-3.5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-caption font-medium text-foreground">Add a source</p>
              <button
                type="button"
                onClick={() => setIsAddingSource(false)}
                className="rounded-md p-0.5 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <LinkIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <Input
                  placeholder="Paste a URL…"
                  value={newUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUrl(e.target.value)}
                  className="h-8 text-sm"
                  disabled={isUploading}
                />
              </div>

              <div className="flex items-center gap-2">
                <Upload className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md"
                  multiple
                  className="h-8 text-sm cursor-pointer file:cursor-pointer"
                  disabled={isUploading}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setHasFiles(e.target.files !== null && e.target.files.length > 0)
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingSource(false)}
                disabled={isUploading}
                className="h-7 px-3 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isUploading || (!newUrl && !hasFiles)}
                className="h-7 gap-1.5 px-3 text-xs"
              >
                {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Upload'}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* ── Learning Spec ────────────────────────────────────── */}
      {spec && (
        <div className="space-y-5">
          <p className="text-overline text-muted-foreground">Learning Spec</p>

          <div className="rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-caption text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    Learning plan
                  </div>
                  <div>
                    <p className="text-caption text-muted-foreground mb-1">Topic</p>
                    <p className="text-title3 font-medium text-foreground">
                      {spec.topic || 'Untitled learning session'}
                    </p>
                  </div>
                </div>

                <Badge
                  variant={spec.is_ready ? 'default' : 'secondary'}
                  className="rounded-full px-3 py-0.5 self-start"
                >
                  {spec.is_ready ? 'Ready to learn' : 'Drafting plan'}
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/60 bg-background/75 p-3">
                  <div className="mb-1.5 flex items-center gap-2 text-caption text-muted-foreground">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Level
                  </div>
                  <p className="text-body text-foreground capitalize">
                    {spec.experience_level || '—'}
                  </p>
                </div>

                <div className="rounded-xl border border-border/60 bg-background/75 p-3">
                  <div className="mb-1.5 flex items-center gap-2 text-caption text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5" />
                    Depth
                  </div>
                  <p className="text-body text-foreground capitalize">
                    {spec.preferred_depth || '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {spec.focus_areas?.length > 0 && (
            <div className="rounded-2xl border border-border/65 bg-card/55 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-body font-medium text-foreground">Focus Areas</p>
                  <p className="text-caption text-muted-foreground">
                    The concepts this session is prioritizing first.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {spec.focus_areas.map((area, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-caption font-normal border-primary/20 bg-primary/5"
                  >
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {spec.learning_goals?.length > 0 && (
            <div className="rounded-2xl border border-border/65 bg-card/55 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-body font-medium text-foreground">Learning Goals</p>
                  <p className="text-caption text-muted-foreground">
                    What this session should leave you understanding.
                  </p>
                </div>
              </div>
              <div className="grid gap-2">
                {spec.learning_goals.map((goal, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-border/55 bg-background/75 px-3 py-2.5"
                  >
                    <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                      {i + 1}
                    </span>
                    <span className="text-body leading-snug text-foreground">{goal}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {spec.source_summary && (
            <div className="rounded-2xl border border-border/65 bg-gradient-to-br from-secondary/65 to-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-primary ring-1 ring-border">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-body font-medium text-foreground">Source Summary</p>
                  <p className="text-caption text-muted-foreground">
                    The material Arcgentic is grounding the session in.
                  </p>
                </div>
              </div>
              <p className="rounded-xl border border-border/55 bg-background/70 p-3.5 text-body leading-relaxed text-foreground">
                {spec.source_summary}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────── */}
      {!spec && sources.length === 0 && !isAddingSource && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground/30 mb-3" />
          <p className="text-body text-muted-foreground">
            Session details will appear here as the agent works.
          </p>
        </div>
      )}

      {/* ── Source viewer dialog ──────────────────────────────── */}
      <Dialog open={!!selectedSource} onOpenChange={(open: boolean) => !open && setSelectedSource(null)}>
        <DialogContent className="max-w-3xl w-[92vw] sm:max-w-3xl p-0 overflow-hidden gap-0">
          {/* Header */}
          <div className="flex flex-col gap-3 px-5 pt-5 pb-4 border-b border-border/70 bg-card">
            <DialogHeader className="space-y-0">
              <DialogTitle className="flex items-center gap-2.5 pr-8 text-left">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background text-primary shadow-sm">
                  <FileText className="h-4 w-4" />
                </div>
                <span className="truncate text-title3 font-medium text-foreground leading-tight">
                  {selectedSource?.name || selectedSource?.url || 'Source'}
                </span>
              </DialogTitle>
            </DialogHeader>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 pl-0.5">
              {selectedSource?.url && (
                <a
                  href={selectedSource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-secondary/60 px-2.5 py-1 text-caption text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                >
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate max-w-[220px] sm:max-w-xs">{selectedSource.url}</span>
                </a>
              )}
              {selectedSource?.type && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-secondary px-2 py-0.5 text-caption text-muted-foreground capitalize">
                  {selectedSource.type}
                </span>
              )}
              {selectedSource?.relevance && (
                <span className="text-caption text-muted-foreground/70 italic line-clamp-1 max-w-xs">
                  {selectedSource.relevance}
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <DialogDescription asChild>
            <div className="relative">
              <ScrollArea className="h-[62vh] w-full">
                <div className="px-5 py-4">
                  {selectedSource?.content ? (
                    <div className="source-content-body">
                      {selectedSource.content.split('\n').map((line, i) => (
                        <div key={i} className="source-content-line">
                          <span className="source-line-num">{i + 1}</span>
                          <span className="source-line-text">{line || '\u00A0'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground/40">
                        <FileText className="h-5 w-5" />
                      </div>
                      <p className="text-body text-muted-foreground">No content available</p>
                      <p className="mt-1 text-caption text-muted-foreground/60">
                        This source has not been parsed yet.
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
}
