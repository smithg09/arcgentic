import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/use-user';
import { getEarnedSkills } from '@/api/graphql/queries';
import { createSession } from '@/api/graphql/mutations';
import { HeroPrompt } from '@/components/dashboard/hero-prompt';
import { PromptPills } from '@/components/dashboard/prompt-pills';
import { SkillsStrip } from '@/components/dashboard/skills-strip';
import { SessionsList } from '@/components/dashboard/sessions-list';
import { OnboardingForm } from '@/components/dashboard/onboarding-form';

import { setPendingFiles, setPendingUrls } from '@/lib/pending-uploads';

export function DashboardPage() {
  const { user, isLoading: userLoading, hasUsers } = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: skills } = useQuery({
    queryKey: ['earnedSkills', user?.id],
    queryFn: () => getEarnedSkills(user!.id),
    enabled: !!user?.id
  });

  const createSessionMutation = useMutation({
    mutationFn: createSession,
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      navigate({
        to: '/chat/$sessionId',
        params: { sessionId: session.session_id }
      });
    }
  });

  const handleNewSession = useCallback(
    async (message: string, files?: File[], urls?: string[]) => {
      if (!user) return;
      // Create session with first message as title
      const title = message.length > 80 ? message.slice(0, 77) + '...' : message;

      // Store in localStorage & memory context before nav
      localStorage.setItem('pending_message', message);
      if (files && files.length > 0) {
        setPendingFiles(files);
      }
      if (urls && urls.length > 0) {
        setPendingUrls(urls);
      }

      await createSessionMutation.mutateAsync({
        user_id: user.id,
        title
      });
    },
    [user, createSessionMutation]
  );

  const handleSessionClick = useCallback(
    (sessionId: string) => {
      navigate({ to: '/chat/$sessionId', params: { sessionId } });
    },
    [navigate]
  );

  if (userLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  // Onboarding
  if (!hasUsers) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center px-6">
        <OnboardingForm />
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 py-20 lg:py-32 px-5 sm:px-8 lg:px-10">
      <section>
        <HeroPrompt onSubmit={handleNewSession} isLoading={createSessionMutation.isPending} />
      </section>

      <section className='flex flex-col gap-8 mb-12 max-w-5xl'>
        <PromptPills onSelect={(prompt) => handleNewSession(prompt)} />
      </section>

      {user && (
        <section className='flex flex-col gap-12'>
          {skills?.skills && skills.skills.length > 0 && (
            <aside>
              <SkillsStrip skills={skills.skills} />
            </aside>
          )}
          <div className="min-w-0">
            <SessionsList userId={user.id} onSessionClick={handleSessionClick} />
          </div>
        </section>
      )}
    </main>
  );
}
