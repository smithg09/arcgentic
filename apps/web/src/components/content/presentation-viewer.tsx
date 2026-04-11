import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  StickyNote,
  LayoutGrid,
  FileText,
  Code2,
  Lightbulb,
  CheckSquare,
  Presentation,
  Bookmark,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMarkdownComponents } from './explanation-viewer';

interface Slide {
  slide_number: number;
  type: 'title' | 'section' | 'content' | 'code' | 'diagram' | 'summary';
  title: string;
  content: string;
  notes?: string;
  visual_suggestion?: string;
}

interface PresentationData {
  title: string;
  subtitle?: string;
  slides: Slide[];
}

interface PresentationViewerProps {
  content: string;
}

const SLIDE_TYPE_ICONS: Record<string, typeof FileText> = {
  title: Presentation,
  section: Bookmark,
  content: FileText,
  code: Code2,
  diagram: LayoutGrid,
  summary: CheckSquare,
};

function repairJson(str: string): string {
  let inString = false;
  let isEscaped = false;
  let res = "";
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '"' && !isEscaped) {
      inString = !inString;
      res += char;
    } else if (char === '\\') {
      isEscaped = !isEscaped;
      res += char;
    } else {
      isEscaped = false;
      if (inString && char === '\n') {
        res += '\\n';
      } else if (inString && char === '\r') {
        // ignore
      } else if (inString && char === '\t') {
        res += '\\t';
      } else {
        res += char;
      }
    }
  }
  return res;
}

export function PresentationViewer({ content }: PresentationViewerProps) {
  const data = useMemo<PresentationData>(() => {
    try {
      const parsed = JSON.parse(content);
      return {
        title: parsed.title || 'Presentation',
        subtitle: parsed.subtitle,
        slides: parsed.slides || [],
      };
    } catch (error) {
      try {
        const repaired = JSON.parse(repairJson(content));
        return {
          title: repaired.title || 'Presentation',
          subtitle: repaired.subtitle,
          slides: repaired.slides || [],
        };
      } catch (innerError) {
        return {
          title: 'Presentation',
          slides: [{ slide_number: 1, type: 'content' as const, title: 'Error', content: 'Error parsing presentation' }],
        };
      }
    }
  }, [content]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [showNotes, setShowNotes] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const components = useMarkdownComponents();
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (thumbnailContainerRef.current && showThumbnails) {
      const activeThumbnail = thumbnailContainerRef.current.children[currentSlide] as HTMLElement;
      if (activeThumbnail) {
        const container = thumbnailContainerRef.current;
        const scrollLeft = activeThumbnail.offsetLeft - (container.clientWidth / 2) + (activeThumbnail.clientWidth / 2);
        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
    }
  }, [currentSlide, showThumbnails]);

  const slide = data.slides[currentSlide];
  const totalSlides = data.slides.length;

  const goTo = useCallback((index: number) => {
    setCurrentSlide(Math.max(0, Math.min(index, totalSlides - 1)));
  }, [totalSlides]);

  const goNext = useCallback(() => goTo(currentSlide + 1), [currentSlide, goTo]);
  const goPrev = useCallback(() => goTo(currentSlide - 1), [currentSlide, goTo]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      else if (e.key === 'Escape' && isFullscreen) { setIsFullscreen(false); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, isFullscreen]);

  if (!slide) return null;

  const SlideIcon = SLIDE_TYPE_ICONS[slide.type] || FileText;

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-6' : 'mx-auto max-w-4xl'}`}>
      {/* Slide Area */}
      <div className="relative">
        {/* Slide Card */}
        <div
          key={currentSlide}
          className={`relative overflow-hidden rounded-xl border motion-soft-in transition-all duration-500
          ${slide.type === 'title'
              ? 'bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/20 shadow-lg shadow-primary/5 flex items-center justify-center'
              : slide.type === 'section'
                ? 'bg-gradient-to-tr from-secondary/15 via-background to-background border-secondary/20 shadow-lg flex items-center justify-center'
                : slide.type === 'summary'
                  ? 'bg-gradient-to-b from-card via-card to-secondary-accent/10 border-border shadow-md'
                  : 'bg-card border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]'
            }`}
          style={{ aspectRatio: '16 / 9' }}
        >
          {/* Decorative Background Elements */}
          {(slide.type === 'title' || slide.type === 'section') && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-orb-float-1" />
              <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-secondary/10 rounded-full blur-[80px] animate-orb-float-2" />
            </div>
          )}

          {/* Grid background for content slides */}
          {(slide.type !== 'title' && slide.type !== 'section') && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03] dark:opacity-[0.05] mix-blend-multiply dark:mix-blend-screen">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
            </div>
          )}

          {/* Slide type badge */}
          <div className="absolute top-4 right-4 z-20 motion-chip-in animate-delay-1">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-card/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border border-border shadow-sm">
              <SlideIcon className="h-3 w-3" />
              {slide.type}
            </span>
          </div>

          {/* Slide content */}
          <div className={`relative h-full w-full overflow-y-auto p-10 md:p-14 z-10 ${slide.type === 'title' || slide.type === 'section'
            ? 'flex flex-col items-center justify-center text-center'
            : ''
            }`}>
            {slide.type === 'title' || slide.type === 'section' ? (
              <div className="space-y-6 max-w-4xl mx-auto flex flex-col items-center justify-center h-full">
                <h1 className="text-fluid-display font-hero-heading text-foreground drop-shadow-sm motion-hero animate-delay-1 text-balance">
                  {slide.title}
                </h1>
                {slide.content && (
                  <div className="prose text-fluid-heading font-light text-muted-foreground max-w-2xl text-balance motion-hero animate-delay-3 grow
                  prose-headings:font-hero-heading prose-headings:text-foreground
                  prose-strong:text-primary prose-strong:font-semibold
                  prose-a:text-secondary-accent prose-a:font-medium
                  prose-ul:text-foreground/80 prose-ol:text-foreground/80
                  prose-li:marker:text-primary/60
                  prose-blockquote:border-l-primary/40 prose-blockquote:bg-primary/5 prose-blockquote:not-italic prose-blockquote:font-medium
                  ">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                      {slide.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-8 flex flex-col h-full motion-soft-in animate-delay-1" style={{ animationFillMode: 'both' }}>
                <div className="pb-5 border-b border-border/60">
                  <h2 className="text-fluid-title font-hero-heading text-foreground">
                    {slide.title}
                  </h2>
                </div>
                <div className="prose text-fluid-body text-foreground/90 flex-grow max-w-none
                  prose-headings:font-hero-heading prose-headings:text-foreground
                  prose-strong:text-primary prose-strong:font-semibold
                  prose-a:text-secondary-accent prose-a:font-medium
                  prose-ul:text-foreground/80 prose-ol:text-foreground/80
                  prose-li:marker:text-primary/60
                  prose-blockquote:border-l-primary/40 prose-blockquote:bg-primary/5 prose-blockquote:not-italic prose-blockquote:font-medium
                  ">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                    {slide.content}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation overlay arrows */}
        <button
          onClick={goPrev}
          disabled={currentSlide === 0}
          className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur border border-border flex items-center justify-center
            text-muted-foreground hover:text-foreground hover:bg-background transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={goNext}
          disabled={currentSlide >= totalSlides - 1}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur border border-border flex items-center justify-center
            text-muted-foreground hover:text-foreground hover:bg-background transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-between mt-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-overline text-muted-foreground tabular-nums">
            {currentSlide + 1} / {totalSlides}
          </span>

          {/* Progress dots */}
          <div className="flex gap-1 ml-2">
            {data.slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${i === currentSlide
                  ? 'w-4 bg-primary'
                  : i < currentSlide
                    ? 'w-1.5 bg-primary/40'
                    : 'w-1.5 bg-border'
                  }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {slide.notes && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => setShowNotes(!showNotes)}
            >
              <StickyNote className={`h-3.5 w-3.5 ${showNotes ? 'text-primary' : ''}`} />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md"
            onClick={() => setShowThumbnails(!showThumbnails)}
          >
            <LayoutGrid className={`h-3.5 w-3.5 ${showThumbnails ? 'text-primary' : ''}`} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Speaker Notes */}
      {showNotes && slide.notes && (
        <div className="mt-3 rounded-lg border border-border bg-card/50 p-4 motion-soft-in">
          <p className="text-overline text-muted-foreground mb-1.5">Speaker Notes</p>
          <p className="text-caption text-foreground/80 leading-relaxed">{slide.notes}</p>
        </div>
      )}

      {/* Thumbnail Strip */}
      {showThumbnails && (
        <div className="mt-4 motion-soft-in">
          <div ref={thumbnailContainerRef} className="flex gap-3 overflow-x-auto p-4 no-scrollbar items-center snap-x px-1">
            {data.slides.map((s, i) => {
              const isTitle = s.type === 'title';
              const isSection = s.type === 'section';
              const isSummary = s.type === 'summary';

              return (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`relative flex-shrink-0 w-36 rounded-xl border overflow-hidden transition-all duration-300 cursor-pointer snap-center group shadow-sm
                    ${i === currentSlide
                      ? 'border-primary ring-2 ring-primary/20 ring-offset-2 ring-offset-background scale-105 shadow-md'
                      : 'border-border/60 hover:border-primary/40 hover:shadow-md hover:-translate-y-1'
                    }`}
                >
                  <div className={`aspect-[16/9] flex items-center justify-center p-3 relative
                    ${isTitle ? 'bg-gradient-to-br from-primary/10 via-background to-accent/10' :
                      isSection ? 'bg-gradient-to-tr from-secondary/15 via-background to-background' :
                        isSummary ? 'bg-gradient-to-b from-card via-card to-secondary-accent/10' :
                          'bg-card'}
                  `}>
                    {/* Tiny grid for content slides in thumbnail */}
                    {(!isTitle && !isSection) && (
                      <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:8px_8px] pointer-events-none" />
                    )}

                    <div className="text-center z-10 w-full flex flex-col items-center">
                      <p className={`text-[10px] leading-tight line-clamp-3 px-1 ${isTitle || isSection ? 'font-hero-heading font-medium text-foreground tracking-tight drop-shadow-sm' : 'font-semibold text-foreground/80 font-sans'
                        }`}>
                        {s.title}
                      </p>
                      <p className="text-[8px] text-muted-foreground mt-1.5 font-medium bg-background/50 backdrop-blur-sm inline-block px-1.5 py-0.5 rounded-sm shadow-sm border border-border/40">
                        {s.slide_number || i + 1}
                      </p>
                    </div>

                    {/* Overlay on hover for non-active */}
                    {i !== currentSlide && (
                      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-300 pointer-events-none" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
