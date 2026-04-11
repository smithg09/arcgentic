import { useState, useEffect, useMemo, useCallback, useRef, useId } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Loader2, Sparkles, ExternalLink } from 'lucide-react';
import { Button } from '@arcgentic/ui/button';
import mermaid from 'mermaid';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@arcgentic/ui/dialog';
import { createSession } from '@/api/graphql/mutations';
import { useCurrentUser } from '@/hooks/use-user';

interface ConceptNode {
  id: string;
  label: string;
  type: 'core' | 'sub' | 'related' | 'example';
  prompt: string;
  description: string;
}

interface ConceptEdge {
  source: string;
  target: string;
  label: string;
  type: 'contains' | 'requires' | 'relates_to' | 'leads_to';
}

interface RoadmapData {
  title: string;
  description?: string;
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

interface ConceptMapViewerProps {
  content: string;
}

// Render variables
let mermaidInitialized = false;

export function ConceptMapViewer({ content }: ConceptMapViewerProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId().replace(/:/g, '');

  const data = useMemo<RoadmapData>(() => {
    try {
      const parsed = JSON.parse(content);
      return {
        title: parsed.title || 'Roadmap',
        description: parsed.description,
        nodes: parsed.nodes || [],
        edges: parsed.edges || [],
      };
    } catch {
      return { title: 'Roadmap', nodes: [], edges: [] };
    }
  }, [content]);

  const code = useMemo(() => {
    let str = "graph LR\n";
    str += `
      classDef core fill:#e11d48,stroke:#be123c,stroke-width:2px,color:#fff,rx:8px,ry:8px,font-weight:600;
      classDef sub fill:#0f766e,stroke:#0d9488,stroke-width:2px,color:#fff,rx:8px,ry:8px,font-weight:600;
      classDef related fill:#f1f5f9,stroke:#cbd5e1,stroke-width:1px,color:#334155,rx:8px,ry:8px,font-weight:500;
      classDef example fill:#f8fafc,stroke:#e2e8f0,stroke-width:1px,color:#475569,rx:8px,ry:8px,font-weight:500;
    `;

    data.nodes.forEach(n => {
      const safeId = "N_" + n.id.replace(/[^a-zA-Z0-9]/g, '');
      const label = n.label.replace(/"/g, "'");
      str += `  ${safeId}["${label}"]:::${n.type}\n`;
    });

    data.edges.forEach(e => {
      const sId = "N_" + e.source.replace(/[^a-zA-Z0-9]/g, '');
      const tId = "N_" + e.target.replace(/[^a-zA-Z0-9]/g, '');
      const label = e.label ? e.label.replace(/"/g, "'") : '';
      if (e.type === 'leads_to' || e.type === 'relates_to') {
        str += `  ${sId} -.->|"${label}"| ${tId}\n`;
      } else {
        str += `  ${sId} -->|"${label}"| ${tId}\n`;
      }
    });

    str += `\n  linkStyle default stroke:#94a3b8,stroke-width:1.5px,color:inherit;\n`;

    return str;
  }, [data]);

  const { user } = useCurrentUser();

  const [selectedNode, setSelectedNode] = useState<ConceptNode | null>(null);
  const [hoverState, setHoverState] = useState<{ node: ConceptNode; x: number; y: number } | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Pan & zoom state
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 3 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(v => ({ ...v, scale: Math.max(0.2, Math.min(v.scale * scaleFactor, 5)) }));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
  }, [transform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setTransform(v => ({ ...v, x: panStart.current.tx + dx, y: panStart.current.ty + dy }));
  }, [isPanning]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  useEffect(() => {
    if (!mermaidInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        fontFamily: 'var(--font-sans)',
        securityLevel: 'loose',
        flowchart: { curve: 'bumpX', useMaxWidth: true, htmlLabels: true, nodeSpacing: 60, rankSpacing: 100 },
      });
      mermaidInitialized = true;
    }

    let cancelled = false;

    mermaid.render(`mermaid_${uniqueId}`, code).then(({ svg }) => {
      if (cancelled || !containerRef.current) return;
      containerRef.current.innerHTML = svg;

      // Add interactivity to nodes
      const elements = containerRef.current.querySelectorAll('.node');
      elements.forEach(el => {
        const idAttr = el.getAttribute('id') || '';
        // Extract the ID: Mermaid creates IDs like "flowchart-N_NetworkSecurity-23"
        // We match everything after "N_" up to the last hyphen or end of string.
        const match = idAttr.match(/N_([^-]+)/);
        const cleanId = match ? match[1] : '';

        const nodeData = data.nodes.find(n => n.id.replace(/[^a-zA-Z0-9]/g, '') === cleanId);
        if (nodeData) {
          (el as HTMLElement).style.cursor = 'pointer';
          (el as HTMLElement).style.transition = 'filter 0.15s';

          el.addEventListener('mouseenter', (e) => {
            const ev = e as MouseEvent;
            setHoverState({ node: nodeData, x: ev.clientX, y: ev.clientY });
            (el as HTMLElement).style.filter = 'brightness(1.15) drop-shadow(0 4px 8px rgba(0,0,0,0.15))';
          });

          el.addEventListener('mouseleave', () => {
            setHoverState(null);
            (el as HTMLElement).style.filter = 'none';
          });

          el.addEventListener('mousemove', (e) => {
            const ev = e as MouseEvent;
            setHoverState(prev => prev ? { ...prev, x: ev.clientX, y: ev.clientY } : prev);
          });

          el.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            setSelectedNode(nodeData);
          });
        }
      });
    }).catch(err => {
      console.warn('Mermaid render error', err);
    });

    return () => { cancelled = true; };
  }, [code, uniqueId, data.nodes]);

  const handleCreateSession = useCallback(async () => {
    if (!selectedNode) return;
    setIsCreating(true);
    try {
      const session = await createSession({
        user_id: user?.id || '00000000-0000-0000-0000-000000000001',
        title: selectedNode.label,
      });
      setSelectedNode(null);
      localStorage.setItem('pending_message', selectedNode.prompt);
      window.open(`/chat/${session.session_id}`, '_self');
    } catch (err) {
      console.error('Failed to create session:', err);
    } finally {
      setIsCreating(false);
    }
  }, [selectedNode, navigate]);

  return (
    <div className="space-y-4 relative">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-heading text-foreground">{data.title}</h2>
        {data.description && (
          <p className="text-body text-muted-foreground">{data.description}</p>
        )}
      </div>

      {/* Mermaid Graph Container */}
      <div
        className="rounded-xl border border-border bg-card/50 overflow-hidden min-h-[500px] flex items-center justify-center cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ touchAction: 'none' }}
      >
        <div
          ref={containerRef}
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out'
          }}
          className="will-change-transform flex items-center justify-center p-8"
        >
        </div>
      </div>

      <p className="text-caption text-muted-foreground/50 text-center">
        Click a node to explore related concepts
      </p>

      {/* Floating Tooltip */}
      {hoverState && hoverState.node.description && (
        <div
          className="fixed z-50 pointer-events-none rounded-md border border-border bg-popover px-3 py-2 shadow-xl max-w-xs transition-opacity duration-150"
          style={{ left: Math.min(hoverState.x + 15, window.innerWidth - 300), top: hoverState.y + 15 }}
        >
          <div className="text-xs font-semibold mb-1 text-popover-foreground">{hoverState.node.label}</div>
          <p className="text-[11px] text-muted-foreground leading-snug">{hoverState.node.description}</p>
        </div>
      )}

      {/* Node Click → Create Session Modal */}
      <Dialog open={!!selectedNode} onOpenChange={(open) => !open && setSelectedNode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Explore: {selectedNode?.label}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {selectedNode?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="rounded-lg border border-border bg-secondary/30 p-3">
              <p className="text-overline text-muted-foreground mb-1">Learning Prompt</p>
              <p className="text-body text-foreground">{selectedNode?.prompt}</p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => setSelectedNode(null)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateSession}
                disabled={isCreating}
                className="gap-2"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                Start Learning
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
