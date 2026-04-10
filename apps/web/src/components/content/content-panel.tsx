import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArticleViewer } from './article-viewer';
import { FlashcardViewer } from './flashcard-viewer';
import { SessionDetails } from './session-details';
import { EmptyState } from './empty-state';
import { BookOpen, FileText, Layers, Info } from 'lucide-react';
import type { AgentState } from '@/types/agent';

interface ContentPanelProps {
  agentState: AgentState | null;
  isLoading?: boolean;
}

export function ContentPanel({ agentState, isLoading }: ContentPanelProps) {
  const resources = agentState?.resources || {};
  const resourceKeys = Object.keys(resources);
  const hasResources = resourceKeys.length > 0;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 rounded-md bg-muted animate-pulse" />
      </div>
    );
  }

  const getIcon = (key: string) => {
    const className =
      'h-[15px] w-[15px] transition-colors text-muted-foreground group-data-[state=active]:text-primary group-hover:text-foreground/80';
    if (key.includes('article')) return <FileText className={className} strokeWidth={2.2} />;
    if (key.includes('flashcard')) return <Layers className={className} strokeWidth={2.2} />;
    return <BookOpen className={className} strokeWidth={2.2} />;
  };

  const getLabel = (key: string) => {
    return key
      .replace(/\.(md|json|svg|pdf)$/gi, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // If there's no spec and no resources, we show empty state
  if (!agentState?.spec && !hasResources) {
    return (
      <div className="flex h-full flex-col items-center justify-center border-l border-border bg-card">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col border-l border-border bg-background">
      <Tabs defaultValue="details" className="flex h-full flex-col min-h-0">
        <div className="no-scrollbar sticky top-0 z-10 w-full shrink-0 overflow-x-auto border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <TabsList
            variant="line"
            className="inline-flex h-[42px] w-max items-center justify-start gap-2 bg-transparent px-4 pb-0 pt-0.5"
          >
            <TabsTrigger
              value="details"
              className="group relative flex h-full items-center justify-center gap-2 px-3 text-[13px] font-medium tracking-tight text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/60 data-[state=active]:bg-primary/15 data-[state=active]:text-primary outline-none rounded-t-md bg-transparent after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-t-full after:bg-primary after:opacity-0 data-[state=active]:after:opacity-100 transition-all duration-200"
            >
              <Info
                className="h-[15px] w-[15px] transition-colors text-muted-foreground group-data-[state=active]:text-primary group-hover:text-foreground/80"
                strokeWidth={2.2}
              />
              Details
            </TabsTrigger>
            {resourceKeys.map((key) => (
              <TabsTrigger
                key={key}
                value={key}
                className="group relative flex h-full items-center justify-center gap-2 px-3 text-[13px] font-medium tracking-tight text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/60 data-[state=active]:bg-primary/15 data-[state=active]:text-primary outline-none rounded-t-md bg-transparent after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-t-full after:bg-primary after:opacity-0 data-[state=active]:after:opacity-100 transition-all duration-200"
              >
                {getIcon(key)}
                {getLabel(key)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <TabsContent value="details" className="mt-0 px-4 py-5 md:px-5 md:py-6">
            <SessionDetails agentState={agentState} />
          </TabsContent>

          {resourceKeys.map((key) => (
            <TabsContent key={key} value={key} className="mt-0 px-4 py-5 md:px-5 md:py-6">
              {key.includes('flashcard') ? (
                <FlashcardViewer content={resources[key].content} />
              ) : (
                <ArticleViewer content={resources[key].content} />
              )}
            </TabsContent>
          ))}
        </ScrollArea>
      </Tabs>
    </div>
  );
}
