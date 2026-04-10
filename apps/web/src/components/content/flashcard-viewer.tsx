import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FlashcardViewerProps {
  content: string;
}

interface Flashcard {
  front: string;
  back: string;
}

export function FlashcardViewer({ content }: FlashcardViewerProps) {
  const cards = useMemo<Flashcard[]>(() => {
    try {
      return JSON.parse(content);
    } catch {
      return [{ front: 'Error parsing flashcards', back: content }];
    }
  }, [content]);

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [order, setOrder] = useState<number[]>(cards.map((_, i) => i));

  const currentIndex = order[index];
  const card = cards[currentIndex];

  const shuffle = () => {
    const newOrder = [...order].sort(() => Math.random() - 0.5);
    setOrder(newOrder);
    setIndex(0);
    setFlipped(false);
    setShuffled(true);
  };

  const reset = () => {
    setOrder(cards.map((_, i) => i));
    setIndex(0);
    setFlipped(false);
    setShuffled(false);
  };

  if (!card) return null;

  return (
    <div className="mx-auto max-w-lg">
      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-overline text-muted-foreground">
          {index + 1} of {cards.length}
        </span>
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

      <p className="text-caption text-muted-foreground/50 text-center mt-2">Click to flip</p>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-3 mt-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md"
          onClick={() => {
            setIndex(Math.max(0, index - 1));
            setFlipped(false);
          }}
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
          onClick={() => {
            setIndex(Math.min(cards.length - 1, index + 1));
            setFlipped(false);
          }}
          disabled={index === cards.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
