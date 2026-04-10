import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import {
  Globe,
  BookOpen,
  ExternalLink,
  FileText,
  Plus,
  Upload,
  Link as LinkIcon,
  Loader2
} from 'lucide-react';
import type { AgentState, Source } from '@/types/agent';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

      // Cleanup
      setNewUrl('');
      setHasFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsAddingSource(false);

      // Refresh state without full reload
      queryClient.invalidateQueries({ queryKey: ['agentState', agentState.session_id] });
    } catch (err) {
      console.error('Failed to upload source:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Learning Spec */}
      {spec && (
        <div className="space-y-5">
          <p className="text-overline text-muted-foreground mb-3">Learning Spec</p>
          <div className="space-y-5">
            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
              <div>
                <p className="text-caption text-muted-foreground mb-1">Topic</p>
                <p className="text-body font-medium text-foreground">{spec.topic || '—'}</p>
              </div>
              <div>
                <p className="text-caption text-muted-foreground mb-1">Level</p>
                <p className="text-body text-foreground capitalize">
                  {spec.experience_level || '—'}
                </p>
              </div>
              <div>
                <p className="text-caption text-muted-foreground mb-1">Depth</p>
                <p className="text-body text-foreground capitalize">
                  {spec.preferred_depth || '—'}
                </p>
              </div>
              <div>
                <p className="text-caption text-muted-foreground mb-1">Status</p>
                <Badge
                  variant={spec.is_ready ? 'default' : 'secondary'}
                  className="rounded-full text-caption py-0 mt-0.5"
                >
                  {spec.is_ready ? 'Ready' : 'Drafting'}
                </Badge>
              </div>
            </div>

            {spec.focus_areas?.length > 0 && (
              <div>
                <p className="text-caption text-muted-foreground mb-1.5">Focus Areas</p>
                <div className="flex flex-wrap gap-2">
                  {spec.focus_areas.map((area, i) => (
                    <Badge key={i} variant="outline" className="text-caption font-normal bg-card">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {spec.learning_goals?.length > 0 && (
              <div>
                <p className="text-caption text-muted-foreground mb-1.5">Learning Goals</p>
                <ul className="space-y-1.5">
                  {spec.learning_goals.map((goal, i) => (
                    <li key={i} className="flex items-start gap-2 text-body text-foreground">
                      <span className="text-primary mt-0.5 font-bold leading-none">·</span>
                      <span className="leading-snug">{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {spec.source_summary && (
              <div>
                <p className="text-caption text-muted-foreground mb-1.5">Source Summary</p>
                <p className="text-body text-foreground bg-secondary/50 p-3 rounded-lg leading-relaxed">
                  {spec.source_summary}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sources */}
      {sources.length > 0 && (
        <div className="space-y-4">
          <p className="text-overline text-muted-foreground mb-3">Sources ({sources.length})</p>
          <div className="space-y-2.5">
            {sources.map((source, i) => (
              <button
                key={i}
                onClick={() => setSelectedSource(source)}
                className="w-full text-left group flex items-start gap-2.5 rounded-lg border border-border p-3 transition-colors hover:border-primary/20 hover:bg-accent/30 cursor-pointer"
              >
                <Globe className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-body font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {source.name || source.url}
                  </p>
                  {source.relevance && (
                    <p className="text-caption text-muted-foreground mt-0.5 line-clamp-2">
                      {source.relevance}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="pt-1">
            {!isAddingSource ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingSource(true)}
                className="w-full text-muted-foreground hover:text-foreground border-dashed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add More Sources
              </Button>
            ) : (
              <form
                onSubmit={handleAddSource}
                className="space-y-3.5 rounded-lg border border-border bg-card/50 p-3.5"
              >
                <p className="text-caption font-medium text-foreground">Add Context</p>

                <div className="space-y-3">
                  <div className="flex gap-2 items-center">
                    <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                      placeholder="Paste a URL..."
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      className="h-8 text-sm"
                      disabled={isUploading}
                    />
                  </div>

                  <div className="flex gap-2 items-center">
                    <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.txt,.md"
                      multiple
                      className="h-8 text-sm cursor-pointer file:cursor-pointer"
                      disabled={isUploading}
                      onChange={(e) =>
                        setHasFiles(e.target.files !== null && e.target.files.length > 0)
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingSource(false)}
                    disabled={isUploading}
                    className="h-7 text-xs px-3"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isUploading || (!newUrl && !hasFiles)}
                    className="h-7 text-xs gap-1.5 px-3"
                  >
                    {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Upload'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Empty */}
      {!spec && sources.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground/30 mb-3" />
          <p className="text-body text-muted-foreground">
            Session details will appear here as the agent works.
          </p>
        </div>
      )}

      {/* Source Detail Modal */}
      <Dialog open={!!selectedSource} onOpenChange={(open) => !open && setSelectedSource(null)}>
        <DialogContent className="max-w-3xl w-[90vw] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl pr-8 text-left">
              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{selectedSource?.name || selectedSource?.url}</span>
            </DialogTitle>
            <DialogDescription className="mt-2 text-left">
              <a
                href={selectedSource?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate max-w-[250px] sm:max-w-md">{selectedSource?.url}</span>
              </a>
            </DialogDescription>
          </DialogHeader>
          <div className="-mx-4 px-4 border-t pt-4 mt-2">
            <ScrollArea className="h-[60vh] w-full pr-4">
              <div className="whitespace-pre-wrap font-mono text-xs md:text-sm leading-relaxed text-muted-foreground pb-4 break-words">
                {selectedSource?.content ? (
                  selectedSource.content
                ) : (
                  <span className="italic">No content available for this source.</span>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
