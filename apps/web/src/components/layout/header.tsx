import { Moon, Sun, Settings } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { useCurrentUser } from '@/hooks/use-user';
import { useModelSettings } from '@/hooks/use-model-settings';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useCurrentUser();
  const { openSettings, isConfigured } = useModelSettings();

  return (
    <header className="sticky top-0 z-50 w-full bg-background backdrop-blur-xl border-b border-border/50">
      <div className="flex h-14 items-center justify-between px-5 md:px-8">
        {/* Logo area — heading font for brand */}
        <a
          href="/"
          className="group flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring p-1 -ml-1 rounded-md transition-opacity hover:opacity-80"
        >
          <Logo className="h-7 w-7 shrink-0 transition-transform duration-500 ease-out group-hover:scale-105" />
          <span className="font-heading text-xl tracking-tight text-foreground transition-colors">
            Arcgentic
          </span>
        </a>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {user && (
            <div className="hidden sm:flex items-center gap-3 pr-4 border-r border-border/40">
              <div className="group flex items-center gap-2.5 px-2 py-1 rounded-full hover:bg-muted/50 transition-colors cursor-default">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                  <span className="font-sans text-[10px] font-bold tracking-wider leading-none">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="font-sans text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                  {user.name}
                </span>
              </div>
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={cn(
              'relative flex h-8 w-8 items-center justify-center rounded-full bg-transparent transition-colors',
              'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground/60 hover:text-foreground cursor-pointer'
            )}
            aria-label="Toggle theme"
          >
            <div className="relative flex h-full items-center justify-center overflow-hidden transition-transform duration-500 hover:rotate-12">
              {theme === 'dark' ? (
                <Sun className="h-[18px] w-[18px]" strokeWidth={2} />
              ) : (
                <Moon className="h-[18px] w-[18px]" strokeWidth={2} />
              )}
            </div>
          </button>

          {/* Settings button */}
          <button
            onClick={() => openSettings()}
            className={cn(
              'relative flex h-8 w-8 items-center justify-center rounded-full bg-transparent transition-colors',
              'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground/60 hover:text-foreground cursor-pointer'
            )}
            aria-label="Model settings"
          >
            <div className="relative flex h-full items-center justify-center">
              <Settings className="h-[18px] w-[18px]" strokeWidth={2} />
              {isConfigured && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
              )}
            </div>
          </button>

        </div>
      </div>
    </header>
  );
}
