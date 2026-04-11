import { useEffect, useRef, useId, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import mermaid from 'mermaid';
import type { Components } from 'react-markdown';

interface ExplanationViewerProps {
  content: string;
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
      fontSize: '14px',
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
          containerRef.current.innerHTML = `<pre class="text-destructive text-caption p-3 rounded-lg bg-destructive/5 border border-destructive/20">${code}</pre>`;
        }
      }
    })();

    return () => { cancelled = true; };
  }, [code, uniqueId]);

  return (
    <div
      ref={containerRef}
      className="my-6 flex justify-center overflow-x-auto rounded-xl border border-border bg-card/50 p-4"
    />
  );
}

/* ── Custom components for ReactMarkdown ── */
export function useMarkdownComponents(): Components {
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
    td({ children }) {
      return (
        <td className="px-4 py-2 text-body text-foreground/90 border-b border-border/50">
          {children}
        </td>
      );
    },
    tr({ children }) {
      return (
        <tr className="transition-colors hover:bg-muted/30 even:bg-secondary/20">
          {children}
        </tr>
      );
    },
  }), []);
}

export function ExplanationViewer({ content }: ExplanationViewerProps) {
  const components = useMarkdownComponents();

  return (
    <div className="prose ml-12">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
