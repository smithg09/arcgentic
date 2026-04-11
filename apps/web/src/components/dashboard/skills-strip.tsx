import { Badge } from '@arcgentic/ui/badge';

interface SkillsStripProps {
  skills: string[];
}

export function SkillsStrip({ skills }: SkillsStripProps) {
  if (skills.length === 0) return null;

  return (
    <div
      className="animate-in-up flex flex-col gap-4"
      style={{ animationDelay: '300ms' }}
    >
      <h2 className="text-overline text-muted-foreground">
        Earned Skills
      </h2>
      {/* <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground"></p> */}
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
