import { BookOpen } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@arcgentic/ui/tooltip';
import type { Citation } from '@/lib/citations';

interface CitationBadgeProps {
  citation: Citation;
  onClick: (citation: Citation) => void;
}

/**
 * Inline citation badge — a small superscript-style marker that
 * shows the source name on hover and opens the source drawer on click.
 */
export function CitationBadge({ citation, onClick }: CitationBadgeProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick(citation);
            }}
            className="
              citation-badge
              inline-flex items-center justify-center
              ml-0.5
              px-1 py-0.5 rounded-md
              text-[13px] font-bold tabular-nums leading-none
              text-primary bg-primary/5
              cursor-pointer
              transition-all duration-200
              hover:bg-primary/15 hover:text-primary hover:-translate-y-1
              active:scale-95
              border border-transparent hover:border-primary/20
            "
            aria-label={`Citation ${citation.id} from ${citation.source_name}`}
          >
            [{citation.id}]
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs text-xs leading-relaxed"
        >
          <div className="flex items-start gap-2">
            <BookOpen className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
            <div className="flex flex-col gap-1">
              <p className="font-semibold leading-tight text-inherit">{citation.source_name}</p>
              <p className="text-[11px] line-clamp-3 italic leading-relaxed bg-background/20 p-1.5 rounded-sm border border-background/20 opacity-80">
                "{citation.excerpt}"
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
