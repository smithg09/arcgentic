import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  AudioLines,
  BookOpenText,
  BrainCircuit,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  FileUp,
  GitBranch,
  GraduationCap,
  ImagePlay,
  Layers3,
  Maximize2,
  MessageSquareMore,
  Pause,
  PlayCircle,
  Play,
  Presentation,
  Sparkles,
  SquareDashedMousePointer,
  Waypoints,
  X,
} from 'lucide-react';
import { Button } from '@arcgentic/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@arcgentic/ui/card';
import { FloatingGeometry } from '@/components/floating-geometry';

type FeatureId = 'guidance' | 'artifacts' | 'roadmaps' | 'modes';
type ModeId = 'deep-dives' | 'flashcards' | 'podcast' | 'slides' | 'roadmap';

type Feature = {
  id: FeatureId;
  name: string;
  eyebrow: string;
  description: string;
  icon: typeof BrainCircuit;
  accent: string;
};

const features: Feature[] = [
  {
    id: 'guidance',
    name: 'Tutor chat that keeps momentum',
    eyebrow: 'Interactive guidance',
    description:
      'Start with a question, upload a PDF or URL as source material, and learn in a guided conversation that stays practical instead of generic.',
    icon: MessageSquareMore,
    accent: 'from-[oklch(0.68_0.13_38)] to-[oklch(0.9_0.04_70)]',
  },
  {
    id: 'artifacts',
    name: 'Visual artifacts inside the session',
    eyebrow: 'Generated on demand',
    description:
      'Arcgentic can render diagrams, widgets, and visual explainers inside the lesson so complex ideas become easier to inspect and remember.',
    icon: Sparkles,
    accent: 'from-[oklch(0.62_0.1_215)] to-[oklch(0.92_0.03_235)]',
  },
  {
    id: 'roadmaps',
    name: 'Concept roadmaps that connect ideas',
    eyebrow: 'See the whole system',
    description:
      'Roadmaps make the learning path visible, helping you understand dependencies, sequence the topic, and know what to study next.',
    icon: Compass,
    accent: 'from-[oklch(0.58_0.11_155)] to-[oklch(0.9_0.03_175)]',
  },
  {
    id: 'modes',
    name: 'Study packs built for repetition',
    eyebrow: 'Multiple learning modes',
    description:
      'Deep dives, flashcards, podcasts, slides, and roadmaps all come out of the same session, giving you multiple ways to revisit and retain the material.',
    icon: Layers3,
    accent: 'from-[oklch(0.66_0.14_18)] to-[oklch(0.92_0.03_55)]',
  },
];

const setupSteps = [
  {
    step: '01',
    title: 'Clone the repository',
    detail: 'Pull Arcgentic locally from GitHub and move into the monorepo workspace.',
    command: 'git clone https://github.com/smithg09/arcgentic\ncd arcgentic',
  },
  {
    step: '02',
    title: 'Run the automated setup',
    detail: 'Install dependencies, prepare services, and scaffold local environment files.',
    command: 'make setup',
  },
  {
    step: '03',
    title: 'Start the platform',
    detail: 'Launch the full stack with Docker Compose and open the web app in your browser.',
    command: 'docker compose up -d',
  },
];

const repoBaseUrl = 'https://github.com/smithg09/arcgentic';

const docsLinks = [
  { label: 'GitHub Repo', href: repoBaseUrl },
  { label: 'Getting Started', href: '/docs/#/getting-started.md' },
  { label: 'Contributing', href: '/docs/#/contributing.md' },
];

type WalkthroughSlide = {
  id: string;
  title: string;
  eyebrow: string;
  body: string;
  media?: string;
};

const walkthroughSlides: WalkthroughSlide[] = [
  {
    id: 'dashboard',
    title: 'Dashboard for sessions and learning flow',
    eyebrow: 'Product walkthrough',
    body: 'The dashboard brings new prompts, previous sessions, and learning momentum together in one place.',
    media: '/product_assets/dashboard.gif',
  },
  {
    id: 'chat',
    title: 'Chat with interactive elements',
    eyebrow: 'Product walkthrough',
    body: 'The chat experience keeps tutoring, follow-up questions, and interactive artifacts together in one continuous learning flow.',
    media: '/product_assets/interactive.gif',
  },
  {
    id: 'deep-dives',
    title: 'Deep-dive reading built from the session',
    eyebrow: 'Product walkthrough',
    body: 'Arcgentic can turn a live tutoring session into a structured long-form explanation that is clear enough to read now and useful enough to revisit later.',
    media: '/product_assets/deep-dives.gif',
  },
  {
    id: 'podcast',
    title: 'Podcast-style revision on demand',
    eyebrow: 'Product walkthrough',
    body: 'Podcast-style recaps make it easy to revisit ideas away from the screen, turning downtime into useful revision time.',
    media: '/product_assets/podcast.gif'
  },
  {
    id: 'roadmap',
    title: 'Roadmaps that show concept relationships',
    eyebrow: 'Product walkthrough',
    body: 'Roadmaps reveal how concepts relate, what foundations come first, and where the next branch of the subject begins.',
    media: '/product_assets/roadmap.gif'
  },
  {
    id: 'slides',
    title: 'Slides that summarize the topic arc',
    eyebrow: 'Product walkthrough',
    body: 'Slides compress the lesson into a concise narrative, making review faster and making it easier to explain the subject to someone else.',
    media: '/product_assets/presentation.gif'
  },
  {
    id: 'flashcards',
    title: 'Flashcards for active recall',
    eyebrow: 'Product walkthrough',
    body: 'Flashcards generated from the same topic help learners shift from passive reading to active recall when it is time to reinforce the material.',
    media: '/product_assets/flashcard.gif'
  },
  {
    id: 'details',
    title: 'Details tab with spec and sources',
    eyebrow: 'Product walkthrough',
    body: 'The details view gives learners access to supporting structure, source references, and the context behind each generated output.',
    media: '/product_assets/details.gif'
  },
  {
    id: 'model-switcher',
    title: 'Model selection and settings modal',
    eyebrow: 'Product walkthrough',
    body: 'Model settings let learners tune the AI experience without breaking focus or leaving the flow of study.',
    media: '/product_assets/model_selector.gif'
  },
  {
    id: 'dark-mode',
    title: 'Dark mode for late-night study',
    eyebrow: 'Product walkthrough',
    body: 'Dark mode gives learners a calmer visual setting for long reading sessions, focused review, and lower-light environments.',
    media: '/product_assets/darkmode.gif'
  },
] as const;

const modeExamples: Record<
  ModeId,
  { title: string; eyebrow: string; body: string; icon: typeof BookOpenText }
> = {
  'deep-dives': {
    title: 'Deep dives',
    eyebrow: 'Long-form explanation',
    body: 'A clean reading experience for foundational understanding, nuance, and worked examples.',
    icon: BookOpenText,
  },
  flashcards: {
    title: 'Flashcards',
    eyebrow: 'Active recall',
    body: 'Question-and-answer cards that help you revisit the difficult parts instead of rereading everything.',
    icon: SquareDashedMousePointer,
  },
  podcast: {
    title: 'Podcast',
    eyebrow: 'Audio revision',
    body: 'A conversational recap that turns a walk or commute into reinforcement time.',
    icon: AudioLines,
  },
  slides: {
    title: 'Slides',
    eyebrow: 'Narrative summary',
    body: 'A compressed deck for fast overview, review, or presenting the topic to someone else.',
    icon: Presentation,
  },
  roadmap: {
    title: 'Roadmap',
    eyebrow: 'Topic navigation',
    body: 'A systems view showing relationships, sequencing, and what concepts need to land first.',
    icon: Waypoints,
  },
};

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const [activeMode, setActiveMode] = useState<ModeId>('deep-dives');
  const [activeWalkthrough, setActiveWalkthrough] = useState(0);
  const [isWalkthroughPaused, setIsWalkthroughPaused] = useState(false);
  const [walkthroughCycleKey, setWalkthroughCycleKey] = useState(0);
  const activeModePreview = modeExamples[activeMode];
  const ActiveModeIcon = activeModePreview.icon;
  const activeSlide = walkthroughSlides[activeWalkthrough];

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsVideoModalOpen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  const resetWalkthrough = () => {
    setActiveWalkthrough(0);
    setWalkthroughCycleKey((current) => current + 1);
  };

  const selectWalkthrough = (index: number) => {
    setActiveWalkthrough(index);
    setWalkthroughCycleKey((current) => current + 1);
  };

  useEffect(() => {
    if (isWalkthroughPaused) return;

    const timer = window.setInterval(() => {
      setActiveWalkthrough((current) =>
        current === walkthroughSlides.length - 1 ? 0 : current + 1
      );
    }, 10000);

    return () => window.clearInterval(timer);
  }, [isWalkthroughPaused, walkthroughCycleKey]);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <FloatingGeometry />
      <div className="page-noise" />
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-360 items-center justify-between px-5 py-4 sm:px-8">
          <a href="#home" className="flex items-center gap-3">
            <div className="brand-mark">
              <img src="/Atom.svg" alt="Arcgentic logo" className="h-full w-full" />
            </div>
            <div>
              <p className="font-heading text-xl tracking-tight">Arcgentic</p>
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                Ask · Learn · Master
              </p>
            </div>
          </a>

          <div className="flex items-center gap-4 sm:gap-6">
            <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
              <a href="#walkthrough" className="nav-link" onClick={resetWalkthrough}>
                Walkthrough
              </a>
              <a href="#features" className="nav-link">
                Features
              </a>
            </nav>
            <a href={repoBaseUrl} target="_blank" rel="noreferrer" className="text-foreground/80 hover:text-foreground transition-all hover:-translate-y-0.5 duration-200">
              <GithubIcon className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </a>
            <Button asChild variant="outline" size="sm" className="hidden sm:flex rounded-full px-4 lg:px-5 lg:size-lg">
              <a href="#get-started">Get started</a>
            </Button>
          </div>
        </div>
      </header>

      <main id="home" className="relative z-10">
        <section className="relative overflow-hidden pb-0 lg:pb-16">
          <div className="hero-glow hero-glow-left" />
          <div className="hero-glow hero-glow-right" />
          <div className="mx-auto grid max-w-360 gap-14 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-16 lg:pb-28 lg:pt-24">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm text-muted-foreground shadow-[0_10px_30px_rgba(58,35,20,0.06)]">
                <GraduationCap className="h-4 w-4 text-primary" />
                Personal AI learning ecosystem for self-learners
              </div>

              <div className="space-y-5">
                {/* <p className="eyebrow">Master any subject without building your own curriculum from scratch.</p> */}
                <h1 className="hero-title max-w-2xl text-balance">
                  Learn with an AI tutor that also builds the study materials.
                </h1>
                <p className="max-w-lg text-lg leading-8 text-muted-foreground sm:text-xl">
                  Arcgentic turns one prompt into a complete learning system that you can
                  revisit when the first spark of motivation wears off.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Button asChild size="lg" className="rounded-full px-6 text-base">
                  <a href="#walkthrough" onClick={resetWalkthrough}>
                    Explore platform
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full px-6 text-base">
                  <a href="#get-started">Get started</a>
                </Button>
              </div>

            </div>

            <div className="relative">
              <div className="relative h-[30rem] sm:h-[29rem] w-full max-w-[90rem] mx-auto group perspective-[2000px]">
                {/* Overlapping Middle Shell (Artifacts Bento) - Behind Video */}
                <div className="absolute -right-24 lg:-right-30 -top-18 w-[18rem] sm:w-[22rem] rounded-[2rem] border border-border/50 bg-background/80 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.1)] backdrop-blur-xl transition-all duration-700 group-hover:-translate-y-4 group-hover:translate-x-4 z-99 hidden lg:block opacity-90 scale-85">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-100 p-4 border border-emerald-100 dark:from-emerald-950 dark:to-teal-900 dark:border-emerald-800">
                      <Compass className="mb-2 h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">Roadmap</p>
                      <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">Explore concepts and connections</p>
                    </div>
                    <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-rose-100 p-4 border border-rose-100 dark:from-orange-950 dark:to-rose-900 dark:border-rose-800">
                      <AudioLines className="mb-2 h-6 w-6 text-rose-600 dark:text-rose-400" />
                      <p className="text-sm font-bold text-rose-900 dark:text-rose-100">Podcast</p>
                      <p className="text-xs text-rose-700/80 dark:text-rose-300/80">12 min recap</p>
                    </div>
                  </div>
                </div>

                {/* Background Main Shell (Video Demo) */}
                <div className="absolute inset-0 rounded-[2.5rem] border border-border/40 bg-card/40 backdrop-blur-3xl shadow-[0_36px_90px_rgba(73,45,28,0.12)] transition-all duration-700 group-hover:rotate-x-2 overflow-hidden z-10 hover:z-[100]">
                  <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-6 bg-gradient-to-b from-black/50 to-transparent">
                    <span className="rounded-full bg-primary/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-[0_0_15px_rgba(240,111,63,0.5)] backdrop-blur-sm">
                      Live Demo
                    </span>
                    <span className="text-sm font-medium text-white/90 drop-shadow-md">Arcgentic Platform</span>
                  </div>
                  <video
                    ref={videoRef}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full object-cover sm:object-fill opacity-90 transition-opacity duration-700 group-hover:opacity-100"
                  >
                    <source src="/product_assets/platform_demo_5x.mp4" type="video/mp4" />
                  </video>

                  {/* Custom Controls Overlay */}
                  <div className="absolute inset-0 z-20 flex items-center justify-center transition-opacity duration-300">
                    <button
                      onClick={() => setIsVideoModalOpen(true)}
                      type="button"
                      className="absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-xl bg-black/50 text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-black/70"
                    >
                      <Maximize2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Floating Front Shell (Interactive Chat) */}
                <div className="absolute -left-4 lg:-left-24 -bottom-40 w-[22rem] sm:w-[24rem] rounded-[2rem] border border-border/60 bg-card/95 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.15)] backdrop-blur-2xl transition-all duration-700 group-hover:-translate-y-6 group-hover:-translate-x-2 z-20 opacity-90 scale-70 hidden lg:block">
                  <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                    <MessageSquareMore className="h-4 w-4" /> Live Tutor
                  </div>
                  <div className="space-y-4">
                    <img src="/product_assets/interactive_image2.png" alt="Live tutor" className="w-full h-full object-cover border border-border/60 rounded-[1rem]" />
                    {/* <div className="ml-auto w-10/12 rounded-[1.25rem] rounded-tr-sm bg-primary p-3.5 text-sm leading-6 text-primary-foreground shadow-md">
                      Explain event-driven architecture like I am learning it from scratch.
                    </div>
                    <div className="mr-auto w-11/12 rounded-[1.25rem] rounded-tl-sm border border-border/50 bg-background/80 backdrop-blur-md p-3.5 text-sm leading-6 text-foreground shadow-sm">
                      Great starting point. I’ll teach it in layers and generate a roadmap, slides, and flashcards while we go.
                    </div> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border/60 bg-card/35">
          <div className="mx-auto grid max-w-360 gap-8 px-5 py-8 sm:px-8 md:grid-cols-3">
            {[
              {
                icon: BrainCircuit,
                title: 'Ask anything',
                text: 'Start from a blank question or bring PDFs and URLs into the session.',
              },
              {
                icon: Sparkles,
                title: 'Learn interactively',
                text: 'Get a guided tutor plus artifacts that help you inspect the idea from multiple angles.',
              },
              {
                icon: Layers3,
                title: 'Master with repetition',
                text: 'Keep the slide decks, flashcards, podcasts, and explainers for future revision.',
              },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="walkthrough" className="mx-auto max-w-360 px-5 py-20 sm:px-8 lg:pb-30 lg:pt-40">
          <div className="grid gap-18 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <div className="space-y-4 pt-12">
              <p className="eyebrow">{activeSlide.eyebrow}</p>
              <h2 className="section-title">{activeSlide.title}</h2>
              <p className="section-copy">
                {activeSlide.body}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {walkthroughSlides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => selectWalkthrough(index)}
                    className={index === activeWalkthrough ? 'walkthrough-chip walkthrough-chip-active' : 'walkthrough-chip'}
                  >
                    {slide.id === 'model-switcher' ? 'Model switcher' : slide.id.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <div
              className="demo-placeholder"
              onMouseEnter={() => setIsWalkthroughPaused(true)}
              onMouseLeave={() => setIsWalkthroughPaused(false)}
            >
              <div className="demo-placeholder-inner">
                <div className="demo-carousel-topline">
                  <span className="status-pill">{activeSlide.id.replace('-', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsWalkthroughPaused((current) => !current)}
                      className="carousel-nav-button"
                      aria-label={isWalkthroughPaused ? 'Resume walkthrough autoplay' : 'Pause walkthrough autoplay'}
                    >
                      {isWalkthroughPaused ? (
                        <Play className="h-4 w-4" />
                      ) : (
                        <Pause className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveWalkthrough((current) =>
                          current === 0 ? walkthroughSlides.length - 1 : current - 1
                        )
                      }
                      className="carousel-nav-button"
                      aria-label="Previous walkthrough"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveWalkthrough((current) =>
                          current === walkthroughSlides.length - 1 ? 0 : current + 1
                        )
                      }
                      className="carousel-nav-button"
                      aria-label="Next walkthrough"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {activeSlide.media ? (
                  <>
                    <img
                      src={activeSlide.media}
                      alt={activeSlide.title}
                      className="max-h-[26rem] w-full rounded-[1rem] border object-cover shadow-[0_22px_50px_rgba(70,42,27,0.08)]"
                    />
                    <div>
                      <p className="text-lg font-semibold tracking-tight">{activeSlide.title}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <ImagePlay className="h-10 w-10 text-primary" />
                    <div>
                      <p className="text-lg font-semibold tracking-tight">{activeSlide.title}</p>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                        A quick visual look at how this part of Arcgentic feels in practice, from the
                        interface itself to the learning experience it supports.
                      </p>
                      <p className="mt-3 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                        {isWalkthroughPaused
                          ? 'Autoplay paused'
                          : 'Autoplay advances every 20 seconds'}
                      </p>
                    </div>
                  </>
                )}
                <div className="carousel-progress">
                  {walkthroughSlides.map((slide, index) => (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => selectWalkthrough(index)}
                      className={index === activeWalkthrough ? 'carousel-dot carousel-dot-active' : 'carousel-dot'}
                      aria-label={`Show ${slide.title}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-360 px-5 py-20 sm:px-8 lg:py-24">
          <div className="mb-10 max-w-3xl space-y-4">
            <p className="eyebrow">Feature showcase</p>
            <h2 className="section-title">One topic in, an entire study system out.</h2>
            <p className="section-copy">
              The product experience is the pitch. Arcgentic does not stop at answers; it keeps
              generating the formats that help a learner return, revise, and actually retain.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {features.map(({ id, name, eyebrow, description, icon: Icon, accent }) => (
              <Card
                key={name}
                className="feature-card border-border/70 bg-card/70 py-0 shadow-[0_28px_60px_rgba(62,38,20,0.07)]"
              >
                <CardHeader className="gap-3 border-b border-border/60 px-6 pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="eyebrow-small">{eyebrow}</p>
                      <CardTitle className="mt-2 text-2xl font-semibold tracking-tight">{name}</CardTitle>
                    </div>
                    <div className={`feature-icon bg-gradient-to-br ${accent}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <CardDescription className="max-w-xl pb-5 text-base leading-7 text-muted-foreground">
                    {description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 py-6">
                  <FeaturePreview
                    featureId={id}
                    activeMode={activeMode}
                    activeModePreview={activeModePreview}
                    ActiveModeIcon={ActiveModeIcon}
                    onModeChange={setActiveMode}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="workflow" className="relative overflow-hidden border-y border-border/60 bg-card/30">
          <div className="mx-auto max-w-360 px-5 py-20 sm:px-8 lg:py-24">
            <div className="mb-12 max-w-3xl space-y-4">
              <p className="eyebrow">How it works</p>
              <h2 className="section-title">Ask, learn, master without stitching together five tools.</h2>
              <p className="section-copy">
                Arcgentic keeps the learning loop simple while the system underneath does the heavy
                lifting for research, tutoring, and asset generation.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {[
                {
                  step: '01',
                  title: 'Ask',
                  copy: 'Begin with a question or feed in source material. The session starts from your current level instead of an abstract syllabus.',
                  icon: MessageSquareMore,
                },
                {
                  step: '02',
                  title: 'Learn',
                  copy: 'The tutor breaks ideas into layers, answers follow-up questions, and generates diagrams or widgets when text would slow you down.',
                  icon: BrainCircuit,
                },
                {
                  step: '03',
                  title: 'Master',
                  copy: 'Arcgentic turns the session into reusable outputs so the next revision session begins with structure instead of friction.',
                  icon: GraduationCap,
                },
              ].map(({ step, title, copy, icon: Icon }) => (
                <div key={title} className="workflow-card">
                  <div className="workflow-topline">
                    <span className="workflow-step">{step}</span>
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-8 font-heading text-3xl tracking-tight">{title}</h3>
                  <p className="mt-4 text-base leading-7 text-muted-foreground">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="get-started" className="mx-auto max-w-360 px-5 py-20 sm:px-8 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="space-y-4">
              <p className="eyebrow">Get started locally</p>
              <h2 className="section-title">Launch the full platform in three moves.</h2>
              <p className="section-copy">
                The repo already includes the local workflow. Setup installs dependencies, prepares
                the services, and gets the app ready to run on your machine.
              </p>
              <div className="rounded-[2rem] border border-border/70 bg-card/75 p-6 shadow-soft">
                <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">Prerequisites</p>
                <ul className="mt-4 grid gap-3 text-sm leading-6 text-foreground/85">
                  <li>Node.js 18+ with pnpm 10+</li>
                  <li>Python 3.11+</li>
                  <li>Go 1.21+</li>
                  <li>Docker Desktop or another Docker engine</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              {setupSteps.map(({ step, title, detail, command }) => (
                <div key={step} className="rounded-[2rem] border border-border/70 bg-card/75 p-6 shadow-soft">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="eyebrow-small">Step {step}</p>
                      <h3 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h3>
                    </div>
                    <ChevronRight className="h-5 w-5 text-primary" />
                  </div>
                  <p className="mt-4 text-base leading-7 text-muted-foreground">{detail}</p>
                  <pre className="command-block">
                    <code>{command}</code>
                  </pre>
                </div>
              ))}

              <div className="rounded-[2rem] border border-primary/20 bg-primary/7 p-6">
                <p className="text-sm uppercase tracking-[0.25em] text-primary/70">After launch</p>
                <p className="mt-4 text-base leading-7 text-foreground/90">
                  Open <span className="font-mono text-sm">http://localhost:5173</span> to use the web UI,
                  then explore the docs for deeper setup details and contribution notes.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="rounded-full px-6">
                    <a href={repoBaseUrl} target="_blank" rel="noreferrer">
                      Open GitHub repo
                    </a>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-full px-6">
                    <a href="/docs/#/getting-started.md" target="_blank" rel="noreferrer">
                      Read the setup guide
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-card/45">
        <div className="mx-auto flex max-w-360 flex-col gap-8 px-5 py-10 sm:px-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="font-heading text-2xl tracking-tight">Arcgentic</p>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              A local-first learning environment for people who want more than a chat window when
              they are trying to truly learn something difficult.
            </p>
          </div>

          <div className="flex gap-3 text-sm text-muted-foreground">
            {docsLinks.map(({ label, href }) => (
              <a key={label} href={href} className="footer-link" target="_blank" rel="noreferrer">
                <span>{label}</span>
                <GitBranch className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </footer>

      {isVideoModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/95 p-4 backdrop-blur-xl sm:p-8">
          <div className="relative w-full max-w-[90vw] overflow-hidden rounded-[2rem] border border-border/50 bg-black shadow-2xl">
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute right-6 top-6 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-black/70 cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
            <video
              autoPlay
              loop
              controls
              className="w-full h-full object-contain"
            >
              <source src="/product_assets/platform_demo_5x.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      )}
    </div>
  );
}

function FeaturePreview({
  featureId,
  activeMode,
  activeModePreview,
  ActiveModeIcon,
  onModeChange,
}: {
  featureId: FeatureId;
  activeMode: ModeId;
  activeModePreview: { title: string; eyebrow: string; body: string };
  ActiveModeIcon: typeof BookOpenText;
  onModeChange: (mode: ModeId) => void;
}) {
  if (featureId === 'guidance') {
    return (
      <div className="preview-surface">
        <div className="preview-chat">
          <div className="preview-bubble preview-bubble-user">
            Break this topic into a 30 minute learning path and use the uploaded docs as context.
          </div>
          <div className="preview-bubble preview-bubble-agent">
            I’ll structure the session, reference the uploaded material, and create supporting
            flashcards after each section.
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <span className="source-chip">
            <FileUp className="h-3.5 w-3.5" />
            PDF source attached
          </span>
          {['Beginner friendly', 'Adaptive follow-ups', 'Source aware'].map((pill) => (
            <span key={pill} className="preview-pill">
              {pill}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (featureId === 'artifacts') {
    return (
      <div className="preview-surface">
        <div className="embed-placeholder">
          <img src="/product_assets/interactive_image.png" alt="Interactive explanation" className="w-full h-full max-w-90 object-cover border border-border/60 rounded-[1rem]" />
          <p className="mt-2 text-base font-medium text-foreground/90">Visual explanations inside the lesson</p>
          <p className="max-w-md text-center text-sm leading-6 text-muted-foreground">
            Diagrams, widgets, and interactive visuals help learners understand difficult ideas
            faster without leaving the session.
          </p>
        </div>
      </div>
    );
  }

  if (featureId === 'roadmaps') {
    return (
      <div className="preview-surface">
        <div className="embed-placeholder embed-placeholder-roadmap">
          <img src="/product_assets/roadmap_image.png" alt="Interactive explanation" className="w-full h-full object-cover border border-border/60 max-w-90 rounded-[1rem]" />
          <p className="mt-2 text-base font-medium text-foreground/90">Roadmaps that make the path visible</p>
          <p className="max-w-md text-center text-sm leading-6 text-muted-foreground">
            See how concepts relate, what needs to come first, and where the next branch of the
            topic opens up.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="preview-surface space-y-4">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(modeExamples) as ModeId[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onModeChange(mode)}
            className={mode === activeMode ? 'mode-chip mode-chip-active' : 'mode-chip'}
          >
            {modeExamples[mode].title}
          </button>
        ))}
      </div>
      <div className="mode-preview">
        <div className="mode-preview-icon">
          <ActiveModeIcon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="eyebrow-small">{activeModePreview.eyebrow}</p>
          <p className="mt-2 text-lg font-semibold tracking-tight">{activeModePreview.title}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{activeModePreview.body}</p>
        </div>
      </div>
    </div>
  );
}

export default App;
