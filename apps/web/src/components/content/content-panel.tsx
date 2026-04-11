import { useEffect, useMemo, useRef, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExplanationViewer } from './explanation-viewer';
import { FlashcardViewer } from './flashcard-viewer';
import { PodcastPlayer } from './podcast-player';
import { PresentationViewer } from './presentation-viewer';
import { ConceptMapViewer } from './concept-map-viewer';
import { SessionDetails } from './session-details';
import { EmptyState } from './empty-state';
import {
  FileText,
  Layers,
  Headphones,
  Presentation,
  Share2,
  BookOpen,
  Image,
  Info,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AgentState } from '@/types/agent';

interface ContentPanelProps {
  agentState: AgentState | null;
  isLoading?: boolean;
}

export function ContentPanel({ agentState, isLoading }: ContentPanelProps) {
  const resources = agentState?.resources || {};
  const resourceKeys = Object.keys(resources);
  const hasResources = resourceKeys.length > 0;

  // Sort resource keys in a fixed display order
  const TAB_ORDER: Record<string, number> = {
    'explanation': 0,
    'podcast': 1,
    'presentation': 2,
    'flashcard': 3,
    'roadmap': 4,
  };

  const sortedResourceKeys = useMemo(() => {
    return [...resourceKeys].sort((a, b) => {
      const getOrder = (key: string) => {
        for (const [pattern, order] of Object.entries(TAB_ORDER)) {
          if (key.includes(pattern)) return order;
        }
        return 99;
      };
      return getOrder(a) - getOrder(b);
    });
  }, [resourceKeys]);

  // Default tab: explanation.md if it exists, else first resource, else details
  const defaultTab = useMemo(() => {
    if (sortedResourceKeys.some(k => k.includes('explanation')))
      return sortedResourceKeys.find(k => k.includes('explanation'))!;
    if (hasResources) return sortedResourceKeys[0];
    return 'details';
  }, [sortedResourceKeys, hasResources]);

  const [activeTab, setActiveTab] = useState(defaultTab);
  const hasTabChanged = useRef(false);

  useEffect(() => {
    if (!isLoading && !hasTabChanged.current && defaultTab !== activeTab) {
      setActiveTab(defaultTab);
      hasTabChanged.current = true;
    }
  }, [isLoading, defaultTab, activeTab]);

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
    if (key.includes('explanation')) return <FileText className={className} strokeWidth={2.2} />;
    if (key.includes('podcast')) return <Headphones className={className} strokeWidth={2.2} />;
    if (key.includes('flashcard')) return <Layers className={className} strokeWidth={2.2} />;
    if (key.includes('presentation')) return <Presentation className={className} strokeWidth={2.2} />;
    if (key.includes('roadmap') || key.includes('concept_map')) return <Share2 className={className} strokeWidth={2.2} />;
    if (key.endsWith('.svg')) return <Image className={className} strokeWidth={2.2} />;
    return <BookOpen className={className} strokeWidth={2.2} />;
  };

  const getLabel = (key: string) => {
    return key
      .replace(/\.(md|json|svg|pdf)$/gi, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Render the correct viewer for each resource type
  const renderViewer = (key: string) => {
    const contentStr = resources[key]?.content || '';
    if (key.includes('explanation') || key.endsWith('.md')) {
      return <ExplanationViewer content={contentStr} />;
    }
    if (key.includes('podcast')) {
      return <PodcastPlayer content={contentStr} />;
    }
    if (key.includes('flashcard')) {
      return <FlashcardViewer content={contentStr} />;
    }
    if (key.includes('presentation')) {
      return <PresentationViewer content={contentStr} />;
    }
    if (key.includes('concept_map') || key.includes('roadmap')) {
      return <ConceptMapViewer content={contentStr} />;
    }
    // SVG content — render raw SVG safely
    if (key.endsWith('.svg') || contentStr.trimStart().startsWith('<svg')) {
      return (
        <div
          className="mx-auto max-w-4xl [&>svg]:w-full [&>svg]:h-auto [&>svg]:rounded-xl [&>svg]:border [&>svg]:border-border [&>svg]:bg-card/50 [&>svg]:p-4"
          dangerouslySetInnerHTML={{ __html: contentStr }}
        />
      );
    }
    // Fallback: if JSON try as code block, else markdown
    return <ExplanationViewer content={contentStr} />;
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col min-h-0">
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
            {sortedResourceKeys.map((key) => (
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
            {/* Next button from Details → first resource */}
            {sortedResourceKeys.length > 0 && (
              <div className="mt-8 flex justify-end border-t border-border/30 pt-5">
                <Button
                  variant="outline"
                  className="gap-2 text-[13px] font-medium hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all"
                  onClick={() => setActiveTab(sortedResourceKeys[0])}
                >
                  Next: {getLabel(sortedResourceKeys[0])}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>

          {sortedResourceKeys.map((key, index) => {
            const nextKey = sortedResourceKeys[index + 1];
            const isLast = index === sortedResourceKeys.length - 1;

            return (
              <TabsContent key={key} value={key} className="mt-0 px-4 py-5 md:px-5 md:py-6">
                {renderViewer(key)}
                {/* Next Resource button */}
                <div className="mt-8 flex justify-end border-t border-border/30 pt-5">
                  {isLast ? (
                    <div className="flex items-center gap-2 text-[13px] text-muted-foreground/60">
                      <CheckCircle2 className="h-4 w-4" />
                      You've explored all resources
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="gap-2 text-[13px] font-medium hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all sticky bottom-4"
                      onClick={() => setActiveTab(nextKey)}
                    >
                      Next: {getLabel(nextKey)}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TabsContent>
            );
          })}
        </ScrollArea>
      </Tabs>
    </div>
  );
}
