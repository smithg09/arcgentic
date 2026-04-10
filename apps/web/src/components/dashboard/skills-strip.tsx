import { Badge } from '@/components/ui/badge';

interface SkillsStripProps {
  skills: string[];
}

export function SkillsStrip({ skills }: SkillsStripProps) {
  if (skills.length === 0) return null;

  return (
    <div
      className="animate-in-up rounded-xl border border-border bg-card p-5 shadow-sm"
      style={{ animationDelay: '300ms' }}
    >
      <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Earned Skills</p>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, i) => (
          <Badge key={i} variant="secondary" className="rounded-full font-medium">
            {skill}
          </Badge>
        ))}
      </div>
    </div>
  );
}
