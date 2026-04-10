import { Sparkles } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
        <Sparkles className="h-6 w-6 text-primary/80" />
      </div>
      <p className="text-heading mb-1 text-foreground">No content yet</p>
      <p className="text-body text-muted-foreground max-w-xs">
        Continue the conversation to generate articles, flashcards, and other learning materials.
      </p>
    </div>
  )
}
