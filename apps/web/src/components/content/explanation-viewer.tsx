import { useEffect, useRef, useId, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import mermaid from 'mermaid';
import type { Components } from 'react-markdown';
import { extractMarkdownCitations, parseCitationMarkers } from '@/lib/citations';
import { CitationBadge } from './citation-badge';
import type { Citation } from '@/lib/citations';

interface ExplanationViewerProps {
  content: string;
  onCitationClick?: (citation: Citation) => void;
}

// Initialize mermaid once
let mermaidInitialized = false;
function ensureMermaidInit() {
  if (mermaidInitialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'neutral',
    fontFamily: 'var(--font-sans)',
    securityLevel: 'loose',
    flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' },
    sequence: { useMaxWidth: true },
    themeVariables: {
      fontSize: '16px',
    },
  });
  mermaidInitialized = true;
}

/* ── Mermaid code block renderer ── */
function MermaidBlock({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId().replace(/:/g, '_');

  useEffect(() => {
    ensureMermaidInit();
    let cancelled = false;

    (async () => {
      try {
        const { svg } = await mermaid.render(`mermaid_${uniqueId}`, code);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch {
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = `<pre class="text-destructive text-caption p-3 rounded-lg bg-destructive/5 border border-destructive/20 w-full">${code}</pre>`;
        }
      }
    })();

    return () => { cancelled = true; };
  }, [code, uniqueId]);

  return (
    <div
      ref={containerRef}
      className="my-6 flex justify-center overflow-x-auto rounded-xl border border-border bg-card/50 p-4 mermaid-diagram"
    />
  );
}

/* ── Inline citation renderer for text nodes ── */
function TextWithCitations({
  text,
  citations,
  onCitationClick,
}: {
  text: string;
  citations: Citation[];
  onCitationClick?: (citation: Citation) => void;
}) {
  const segments = useMemo(() => parseCitationMarkers(text), [text]);
  const hasCitations = segments.some((s) => s.type === 'citation');

  if (!hasCitations) return <>{text}</>;

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === 'text') return <span key={i}>{seg.value}</span>;
        const citeId = parseInt(seg.value, 10);
        const citation = citations.find((c) => c.id === citeId);
        if (!citation) return <sup key={i}>[{seg.value}]</sup>;
        return (
          <CitationBadge
            key={i}
            citation={citation}
            onClick={onCitationClick || (() => {})}
          />
        );
      })}
    </>
  );
}

/* ── Custom components for ReactMarkdown ── */
export function useMarkdownComponents(
  citations?: Citation[],
  onCitationClick?: (citation: Citation) => void,
): Components {
  const hasCitations = (citations?.length ?? 0) > 0;

  return useMemo<Components>(() => ({
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const lang = match?.[1];
      const codeString = String(children).replace(/\n$/, '');

      // Mermaid code blocks → render as diagram
      if (lang === 'mermaid') {
        return <MermaidBlock code={codeString} />;
      }

      // Inline code (no language)
      if (!lang) {
        return <code className={className} {...props}>{children}</code>;
      }

      // Block code with syntax highlighting (handled by rehype-highlight)
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    // Wrap text nodes in paragraphs and list items to render citations
    ...(hasCitations
      ? {
          p({ children }) {
            return (
              <p>
                {processChildrenForCitations(children, citations!, onCitationClick)}
              </p>
            );
          },
          li({ children }) {
            return (
              <li>
                {processChildrenForCitations(children, citations!, onCitationClick)}
              </li>
            );
          },
          td({ children }) {
            return (
              <td className="px-4 py-2 text-body text-foreground/90 border-b border-border/50">
                {processChildrenForCitations(children, citations!, onCitationClick)}
              </td>
            );
          },
          blockquote({ children }) {
            return <blockquote>{children}</blockquote>;
          },
        }
      : {}),
    table({ children }) {
      return (
        <div className="my-5 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">{children}</table>
        </div>
      );
    },
    thead({ children }) {
      return <thead className="bg-secondary/60 text-left">{children}</thead>;
    },
    th({ children }) {
      return (
        <th className="px-4 py-2.5 text-caption font-semibold text-foreground border-b border-border">
          {children}
        </th>
      );
    },
    ...(!hasCitations
      ? {
          td({ children }) {
            return (
              <td className="px-4 py-2 text-body text-foreground/90 border-b border-border/50">
                {children}
              </td>
            );
          },
        }
      : {}),
    tr({ children }) {
      return (
        <tr className="transition-colors hover:bg-muted/30 even:bg-secondary/20">
          {children}
        </tr>
      );
    },
  }), [hasCitations, citations, onCitationClick]);
}

/**
 * Process React children to find strings with [[cite:N]] markers
 * and replace them with CitationBadge components.
 */
function processChildrenForCitations(
  children: React.ReactNode,
  citations: Citation[],
  onCitationClick?: (citation: Citation) => void,
): React.ReactNode {
  if (!children) return children;

  const childArray = Array.isArray(children) ? children : [children];

  return childArray.map((child, i) => {
    if (typeof child === 'string' && child.includes('[[cite:')) {
      return (
        <TextWithCitations
          key={i}
          text={child}
          citations={citations}
          onCitationClick={onCitationClick}
        />
      );
    }
    return child;
  });
}

export function ExplanationViewer({ content, onCitationClick }: ExplanationViewerProps) {
  // Extract citations block from the end of the markdown
  const { cleanContent, citations } = useMemo(
    () => extractMarkdownCitations(content),
    [content],
  );

  const components = useMarkdownComponents(citations, onCitationClick);

  return (
    <div className="prose ml-12">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {cleanContent}
      </ReactMarkdown>

      {/* Citation summary footer */}
      {citations.length > 0 && (
        <div className="mt-8 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 not-prose">
          <p className="text-overline text-primary mb-2">
            Sources Cited ({citations.length})
          </p>
          <div className="space-y-1.5">
            {citations.map((c) => (
              <button
                key={c.id}
                onClick={() => onCitationClick?.(c)}
                className="flex items-start gap-2 w-full text-left rounded-md px-2 py-1.5 transition-colors hover:bg-primary/10 cursor-pointer group"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-primary/15 text-[10px] font-bold text-primary mt-0.5">
                  {c.id}
                </span>
                <div className="min-w-0">
                  <p className="text-caption font-medium text-foreground group-hover:text-primary transition-colors truncate">
                    {c.source_name}
                  </p>
                  <p className="text-caption text-muted-foreground line-clamp-1 italic">
                    "{c.excerpt}"
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
