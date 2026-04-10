import { useState } from 'react';

interface PromptPillsProps {
  onSelect: (prompt: string) => void;
}

const STARTER_PROMPTS = [
  'Explain how neural networks learn',
  'Teach me Rust ownership model',
  'What are design patterns in Go?',
  'Introduction to Kubernetes',
  'How does OAuth 2.0 work?',
  'Explain event-driven architecture'
];

export function PromptPills({ onSelect }: PromptPillsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="motion-hero" style={{ animationDelay: '350ms' }}>
      <div className="flex flex-wrap gap-2.5">
        {STARTER_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => onSelect(prompt)}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`relative rounded-full border px-5 py-2.5 text-sm font-medium tracking-tight
              transition-all duration-300 ease-out cursor-pointer
              ${
                hoveredIndex === i
                  ? 'border-primary/50 bg-primary/8 text-primary scale-[1.03] shadow-sm'
                  : 'border-border/60 bg-card/80 text-muted-foreground hover:text-foreground'
              }
              active:scale-[0.97]`}
          >
            <span className="relative flex items-center gap-1.5">
              <span>{prompt}</span>
              {/* Arrow on hover */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-all duration-300 ease-out ${
                  hoveredIndex === i
                    ? 'w-3.5 opacity-100 translate-x-0'
                    : 'w-0 opacity-0 -translate-x-1'
                }`}
                style={{ overflow: 'hidden', flexShrink: 0 }}
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
