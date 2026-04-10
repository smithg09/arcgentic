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
    <div className="animate-in-up">
      <div className="flex flex-wrap gap-3">
        {STARTER_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => onSelect(prompt)}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{ animationDelay: `${180 + i * 45}ms` }}
            className="group relative animate-in-up overflow-hidden rounded-full border border-border/60 bg-background/80 px-5 py-2.5 text-sm font-medium text-muted-foreground backdrop-blur-sm
              hover:border-primary/40 hover:bg-secondary hover:text-foreground
              active:scale-[0.97]
              transition-all duration-300 ease-out-expo cursor-pointer"
          >
            {/* Shimmer effect on hover */}
            <span
              className={`absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-primary/10 to-transparent transition-transform duration-700 ease-out-expo ${
                hoveredIndex === i ? 'translate-x-full' : ''
              }`}
            />
            <span className="relative flex items-center gap-2">
              <span
                className={`transition-all duration-300 ease-out-expo ${
                  hoveredIndex === i ? 'text-primary' : ''
                }`}
              >
                {prompt}
              </span>
              {/* Subtle arrow that appears on hover */}
              <span
                className={`w-0 overflow-hidden transition-all duration-300 ease-out-expo ${
                  hoveredIndex === i ? 'w-4 opacity-100' : 'opacity-0'
                }`}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
