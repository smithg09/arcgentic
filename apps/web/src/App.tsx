import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Outlet
} from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { Header } from '@/components/layout/header';
import { ModelSettingsModal } from '@/components/layout/model-settings-modal';
import { ModelSettingsProvider } from '@/hooks/use-model-settings';
import { DashboardPage } from '@/pages/dashboard';
import { ChatPage } from '@/pages/chat';
import { FloatingGeometry } from '@/components/ui/floating-geometry';

// ─── Query Client ───

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 // 1 minute
    }
  }
});

// ─── Routes ───

const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-background text-foreground relative selection:bg-primary/20">
      {/* Animated background elements */}
      <FloatingGeometry />

      {/* SVG Noise Overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Main Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Toaster />
      </div>
    </div>
  )
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage
});

const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/chat/$sessionId',
  component: ChatPage
});

const routeTree = rootRoute.addChildren([indexRoute, chatRoute]);

const router = createRouter({ routeTree });

// ─── Type Registration ───

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// ─── App ───

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ModelSettingsProvider>
        <TooltipProvider>
          <RouterProvider router={router} />
          <ModelSettingsModal />
        </TooltipProvider>
      </ModelSettingsProvider>
    </QueryClientProvider>
  );
}
