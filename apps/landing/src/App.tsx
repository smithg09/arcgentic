import { useEffect, useState } from 'react';
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
  MessageSquareMore,
  Pause,
  PlayCircle,
  Play,
  Presentation,
  Sparkles,
  SquareDashedMousePointer,
  Waypoints,
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
  { label: 'Getting Started', href: `${repoBaseUrl}/blob/main/docs/getting-started.md` },
  { label: 'Contributing', href: `${repoBaseUrl}/blob/main/docs/contributing.md` },
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

function App() {
  const [activeMode, setActiveMode] = useState<ModeId>('deep-dives');
  const [activeWalkthrough, setActiveWalkthrough] = useState(0);
  const [isWalkthroughPaused, setIsWalkthroughPaused] = useState(false);
  const [walkthroughCycleKey, setWalkthroughCycleKey] = useState(0);
  const activeModePreview = modeExamples[activeMode];
  const ActiveModeIcon = activeModePreview.icon;
  const activeSlide = walkthroughSlides[activeWalkthrough];

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
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <a href="#top" className="flex items-center gap-3">
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

          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#demo" className="nav-link" onClick={resetWalkthrough}>
              Walkthrough
            </a>
            <a href="#features" className="nav-link">
              Features
            </a>
            <Button asChild variant="outline" size="lg" className="rounded-full px-5">
              <a href="#get-started">Get started</a>
            </Button>
          </nav>
        </div>
      </header>

      <main id="top" className="relative z-10">
        <section className="relative overflow-hidden">
          <div className="hero-glow hero-glow-left" />
          <div className="hero-glow hero-glow-right" />
          <div className="mx-auto grid max-w-7xl gap-14 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-16 lg:pb-28 lg:pt-24">
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
                <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                  Arcgentic turns one prompt into a complete learning system: guided tutoring,
                  visual explainers, roadmaps, flashcards, podcasts, and slide decks you can
                  revisit when the first spark of motivation wears off.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Button asChild size="lg" className="rounded-full px-6 text-base">
                  <a href="#demo" onClick={resetWalkthrough}>
                    Explore platform
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full px-6 text-base">
                  <a href="#get-started">Get started</a>
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  'Ask anything or upload your own material',
                  'Learn through chat plus generated artifacts',
                  'Keep a reusable study pack for revision',
                ].map((item) => (
                  <div key={item} className="rounded-3xl border border-border/60 bg-card/75 p-4 shadow-soft">
                    <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm leading-6 text-foreground/85">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="artifact-stage">
                <div className="artifact-shell artifact-shell-main">
                  <div className="artifact-header">
                    <span className="status-pill">Live tutoring</span>
                    <span className="status-copy">Session: Systems design for beginners</span>
                  </div>
                  <div className="artifact-chat">
                    <div className="chat-bubble chat-bubble-user">
                      Explain event-driven architecture like I am learning it from scratch.
                    </div>
                    <div className="chat-bubble chat-bubble-agent">
                      Great starting point. I’ll teach it in layers and generate a roadmap, slides,
                      and flashcards while we go.
                    </div>
                  </div>
                  <div className="artifact-grid">
                    <div className="artifact-card artifact-card-map">
                      <Compass className="h-5 w-5" />
                      <div>
                        <p className="artifact-label">Concept roadmap</p>
                        <p className="artifact-caption">Services, events, queues, consumers</p>
                      </div>
                    </div>
                    <div className="artifact-card artifact-card-podcast">
                      <AudioLines className="h-5 w-5" />
                      <div>
                        <p className="artifact-label">Podcast recap</p>
                        <p className="artifact-caption">12 minute revision episode</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="artifact-shell artifact-shell-side artifact-shell-side-top">
                  <div className="artifact-mini-header">
                    <BookOpenText className="h-4 w-4" />
                    Deep-dive explainer
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 rounded-full bg-primary/15" />
                    <div className="h-2 w-10/12 rounded-full bg-primary/12" />
                    <div className="h-2 w-8/12 rounded-full bg-primary/10" />
                    <div className="rounded-2xl border border-border/60 bg-background/90 p-3 text-xs leading-5 text-muted-foreground">
                      Event-driven systems react to changes instead of forcing every part of the
                      application to wait on a direct response.
                    </div>
                  </div>
                </div>

                <div className="artifact-shell artifact-shell-side artifact-shell-side-bottom">
                  <div className="artifact-mini-header">
                    <PlayCircle className="h-4 w-4" />
                    Flashcards in progress
                  </div>
                  <div className="grid gap-2">
                    <div className="rounded-2xl border border-border/60 bg-background/75 p-3">
                      <p className="text-[0.72rem] uppercase tracking-[0.22em] text-muted-foreground">
                        Question
                      </p>
                      <p className="mt-2 text-sm">
                        Why would teams publish events instead of calling services directly?
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-primary/8 p-3">
                      <p className="text-[0.72rem] uppercase tracking-[0.22em] text-primary/70">
                        Answer cue
                      </p>
                      <p className="mt-2 text-sm">
                        Loose coupling, resilience, and asynchronous scaling.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border/60 bg-card/35">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-8 md:grid-cols-3">
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

        <section id="demo" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:pb-30 lg:pt-40">
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <div className="space-y-4">
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

        <section id="features" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
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
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
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

        <section id="get-started" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
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
                    <a href={`${repoBaseUrl}/blob/main/docs/getting-started.md`} target="_blank" rel="noreferrer">
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
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 sm:px-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="font-heading text-2xl tracking-tight">Arcgentic</p>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              A local-first learning environment for people who want more than a chat window when
              they are trying to truly learn something difficult.
            </p>
          </div>

          <div className="grid gap-3 text-sm text-muted-foreground">
            {docsLinks.map(({ label, href }) => (
              <a key={label} href={href} className="footer-link" target="_blank" rel="noreferrer">
                <span>{label}</span>
                <GitBranch className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </footer>
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
          <img src="/product_assets/interactive_image.png" alt="Interactive explanation" className="w-full h-full object-cover border border-border/60 rounded-[1rem]" />
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
          <img src="/product_assets/roadmap_image.png" alt="Interactive explanation" className="w-full h-full object-cover border border-border/60 rounded-[1rem]" />
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
