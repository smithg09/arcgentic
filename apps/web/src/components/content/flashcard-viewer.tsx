import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FlashcardViewerProps {
  content: string;
}

interface Flashcard {
  id?: number;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  front: string;
  back: string;
  hint?: string;
}

interface FlashcardSet {
  title?: string;
  description?: string;
  cards: Flashcard[];
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  medium: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  hard: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
};

export function FlashcardViewer({ content }: FlashcardViewerProps) {
  const flashcardSet = useMemo<FlashcardSet>(() => {
    try {
      const parsed = JSON.parse(content);
      // Support both wrapped { title, cards: [] } and flat array []
      if (Array.isArray(parsed)) {
        return { cards: parsed };
      }
      return {
        title: parsed.title,
        description: parsed.description,
        cards: parsed.cards || [{ front: 'Error parsing flashcards', back: content }],
      };
    } catch {
      return { cards: [{ front: 'Error parsing flashcards', back: content }] };
    }
  }, [content]);

  const cards = flashcardSet.cards;
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [order, setOrder] = useState<number[]>(cards.map((_, i) => i));

  const currentIndex = order[index];
  const card = cards[currentIndex];

  const shuffle = () => {
    const newOrder = [...order].sort(() => Math.random() - 0.5);
    setOrder(newOrder);
    setIndex(0);
    setFlipped(false);
    setShowHint(false);
    setShuffled(true);
  };

  const reset = () => {
    setOrder(cards.map((_, i) => i));
    setIndex(0);
    setFlipped(false);
    setShowHint(false);
    setShuffled(false);
  };

  const goTo = (i: number) => {
    setIndex(i);
    setFlipped(false);
    setShowHint(false);
  };

  if (!card) return null;

  return (
    <div className="mx-auto max-w-lg">
      {/* Title */}
      {flashcardSet.title && (
        <div className="mb-5 space-y-1">
          <h2 className="text-heading text-foreground">{flashcardSet.title}</h2>
          {flashcardSet.description && (
            <p className="text-body text-muted-foreground">{flashcardSet.description}</p>
          )}
        </div>
      )}

      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-overline text-muted-foreground">
            {index + 1} of {cards.length}
          </span>
          {card.category && (
            <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0">
              {card.category}
            </Badge>
          )}
          {card.difficulty && (
            <span className={`inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide ${DIFFICULTY_COLORS[card.difficulty] || ''}`}>
              {card.difficulty}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={shuffle}>
            <Shuffle className="h-3.5 w-3.5" />
          </Button>
          {shuffled && (
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Card */}
      <button
        onClick={() => setFlipped(!flipped)}
        className="w-full min-h-48 rounded-xl border border-border bg-card p-8 text-center transition-all hover:border-primary/20 active:scale-[0.99] cursor-pointer"
        style={{
          perspective: '1000px'
        }}
      >
        <div
          className="transition-transform"
          style={{
            transform: flipped ? 'rotateX(180deg)' : 'rotateX(0)',
            transformStyle: 'preserve-3d',
            transitionDuration: '400ms',
            transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)'
          }}
        >
          <div className={flipped ? 'invisible' : ''}>
            <p className="text-overline text-muted-foreground mb-3">Question</p>
            <p className="text-heading text-foreground">{card.front}</p>
          </div>
          <div
            className={
              !flipped
                ? 'invisible absolute inset-0 flex flex-col items-center justify-center p-8'
                : 'flex flex-col items-center justify-center'
            }
            style={{ transform: flipped ? 'rotateX(180deg)' : '' }}
          >
            <p className="text-overline text-primary mb-3">Answer</p>
            <p className="text-body text-foreground">{card.back}</p>
          </div>
        </div>
      </button>

      {/* Hint */}
      {card.hint && !flipped && (
        <div className="mt-2 text-center">
          {showHint ? (
            <p className="text-caption text-muted-foreground/70 motion-soft-in">
              💡 {card.hint}
            </p>
          ) : (
            <button
              onClick={() => setShowHint(true)}
              className="inline-flex items-center gap-1 text-caption text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer"
            >
              <Lightbulb className="h-3 w-3" />
              Show hint
            </button>
          )}
        </div>
      )}

      {!card.hint && (
        <p className="text-caption text-muted-foreground/50 text-center mt-2">Click to flip</p>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-center gap-3 mt-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md"
          onClick={() => goTo(Math.max(0, index - 1))}
          disabled={index === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Dot indicators */}
        <div className="flex gap-1">
          {cards.slice(0, Math.min(cards.length, 10)).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i === index ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
          {cards.length > 10 && (
            <span className="text-caption text-muted-foreground ml-1">+{cards.length - 10}</span>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md"
          onClick={() => goTo(Math.min(cards.length - 1, index + 1))}
          disabled={index === cards.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
