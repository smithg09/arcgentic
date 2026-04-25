import { useEffect, useRef, useMemo, useCallback } from 'react';
import { X, ExternalLink, FileText, BookOpen } from 'lucide-react';
import { ScrollArea } from '@arcgentic/ui/scroll-area';
import type { Source } from '@/types/agent';
import type { Citation } from '@/lib/citations';
import { findExcerptOffset } from '@/lib/citations';

interface CitationDrawerProps {
  /** The citation that was clicked (null = drawer closed). */
  citation: Citation | null;
  /** The matching source to display. */
  source: Source | null;
  /** Close handler. */
  onClose: () => void;
}

/**
 * Side drawer that displays source content with the cited excerpt highlighted.
 * Slides in from the right over the content panel.
 */
export function CitationDrawer({ citation, source, onClose }: CitationDrawerProps) {
  const isOpen = !!citation && !!source;
  const highlightRef = useRef<HTMLSpanElement>(null);

  // Find the excerpt position within the source content
  const { lines, highlightLineIdx, highlightStartCol, highlightEndCol } = useMemo(() => {
    if (!source?.content || !citation?.excerpt) {
      return { lines: [], highlightLineIdx: -1, highlightStartCol: 0, highlightEndCol: 0 };
    }

    const contentLines = source.content.split('\n');
    const offset = findExcerptOffset(source.content, citation.excerpt);

    if (offset === -1) {
      return { lines: contentLines, highlightLineIdx: -1, highlightStartCol: 0, highlightEndCol: 0 };
    }

    // Find which line the offset falls on
    let charCount = 0;
    for (let i = 0; i < contentLines.length; i++) {
      const lineEnd = charCount + contentLines[i].length;
      if (offset >= charCount && offset <= lineEnd) {
        return {
          lines: contentLines,
          highlightLineIdx: i,
          highlightStartCol: offset - charCount,
          highlightEndCol: Math.min(offset - charCount + citation.excerpt.length, contentLines[i].length),
        };
      }
      charCount = lineEnd + 1; // +1 for the \n
    }

    return { lines: contentLines, highlightLineIdx: -1, highlightStartCol: 0, highlightEndCol: 0 };
  }, [source?.content, citation?.excerpt]);

  // Auto-scroll to highlighted line
  useEffect(() => {
    if (isOpen && highlightRef.current) {
      // Delay slightly to let the drawer animate open
      const timer = setTimeout(() => {
        highlightRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, highlightLineIdx]);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    },
    [isOpen, onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`
          fixed top-0 right-0 z-50 h-full w-full max-w-xl
          bg-background border-l border-border
          shadow-2xl shadow-black/10
          transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex flex-col gap-3 px-5 pt-5 pb-4 border-b border-border/70 bg-card/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/5 text-primary shadow-sm">
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-body font-medium text-foreground leading-tight">
                  {source?.name || 'Source'}
                </p>
                <p className="text-caption text-muted-foreground">
                  Citation #{citation?.id}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2">
            {source?.url && (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-secondary/60 px-2.5 py-1 text-caption text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
              >
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                <span className="truncate max-w-[200px]">{source.url}</span>
              </a>
            )}
            {source?.type && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-secondary px-2 py-0.5 text-caption text-muted-foreground capitalize">
                <FileText className="h-3 w-3" />
                {source.type}
              </span>
            )}
          </div>

          {/* Cited excerpt preview */}
          {citation?.excerpt && (
            <div className="rounded-lg border border-primary/15 bg-primary/5 px-3.5 py-2.5">
              <p className="text-overline text-primary mb-1">Cited Excerpt</p>
              <p className="text-caption text-foreground/80 leading-relaxed italic">
                "{citation.excerpt}"
              </p>
            </div>
          )}
        </div>

        {/* Source content with highlighted excerpt */}
        <ScrollArea className="h-[calc(100%-200px)]">
          <div className="px-5 py-4">
            {source?.content ? (
              <div className="source-content-body">
                {lines.map((line, i) => {
                  const isHighlightLine = i === highlightLineIdx;

                  return (
                    <div
                      key={i}
                      className={`source-content-line transition-colors duration-300 ${
                        isHighlightLine
                          ? 'bg-primary/8 rounded-md -mx-1 px-1'
                          : ''
                      }`}
                    >
                      <span className="source-line-num">{i + 1}</span>
                      <span className="source-line-text">
                        {isHighlightLine && highlightStartCol >= 0 ? (
                          <>
                            {line.slice(0, highlightStartCol)}
                            <span
                              ref={highlightRef}
                              className="citation-highlight bg-primary/15 text-foreground border-b-2 border-primary/40 rounded-sm px-0.5"
                            >
                              {line.slice(highlightStartCol, highlightEndCol)}
                            </span>
                            {line.slice(highlightEndCol)}
                          </>
                        ) : (
                          line || '\u00A0'
                        )}
                      </span>
                    </div>
                  );
                })}
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
    </>
  );
}
