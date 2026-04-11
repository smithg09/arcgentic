import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Play, Pause, RotateCcw, SkipForward, SkipBack, Volume2, ChevronDown, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PodcastSegment {
  type: 'intro' | 'discussion' | 'example' | 'analogy' | 'deep_dive' | 'qa' | 'recap' | 'outro';
  speaker: 'host' | 'expert';
  text: string;
  notes?: string;
}

interface PodcastData {
  title: string;
  description: string;
  segments: PodcastSegment[];
}

interface PodcastPlayerProps {
  content: string;
}

const SPEAKER_CONFIG: Record<string, { label: string; pitch: number; rate: number; color: string }> = {
  host: { label: 'Host', pitch: 1.0, rate: 1.0, color: 'bg-primary/15 text-primary border-primary/25' },
  expert: { label: 'Expert', pitch: 0.85, rate: 0.95, color: 'bg-secondary-accent/15 text-secondary-accent border-secondary-accent/25' },
  narrator: { label: 'Narrator', pitch: 1.15, rate: 0.9, color: 'bg-accent-foreground/15 text-accent-foreground border-accent-foreground/25' },
};

const SEGMENT_TYPE_LABELS: Record<string, string> = {
  intro: 'Intro',
  discussion: 'Discussion',
  example: 'Example',
  analogy: 'Analogy',
  deep_dive: 'Deep Dive',
  qa: 'Q&A',
  recap: 'Recap',
  outro: 'Outro',
};

export function PodcastPlayer({ content }: PodcastPlayerProps) {
  const podcast = useMemo<PodcastData>(() => {
    try {
      const parsed = JSON.parse(content);
      return {
        title: parsed.title || 'Podcast',
        description: parsed.description || '',
        segments: parsed.segments || [],
      };
    } catch {
      return {
        title: 'Podcast',
        description: '',
        segments: [{ type: 'discussion' as const, speaker: 'host' as const, text: content }],
      };
    }
  }, [content]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [hostVoiceURI, setHostVoiceURI] = useState<string>('');
  const [expertVoiceURI, setExpertVoiceURI] = useState<string>('');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const segmentListRef = useRef<HTMLDivElement>(null);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        const enVoices = voices.filter(v => v.name.includes('Eddy (English (United States') || v.name.includes('Reed (English (United States'));
        if (enVoices.length > 0 && !hostVoiceURI) setHostVoiceURI(enVoices[0].voiceURI);
        if (enVoices.length > 1 && !expertVoiceURI) setExpertVoiceURI(enVoices[1].voiceURI);
        else if (enVoices.length > 0 && !expertVoiceURI) setExpertVoiceURI(enVoices[0].voiceURI);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // Scroll active segment into view
  useEffect(() => {
    if (!segmentListRef.current) return;
    const active = segmentListRef.current.querySelector('[data-active="true"]');
    if (active) {
      active.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentIndex]);

  const speak = useCallback((index: number) => {
    if (index >= podcast.segments.length) {
      setIsPlaying(false);
      setHasStarted(false);
      return;
    }

    window.speechSynthesis.cancel();
    const segment = podcast.segments[index];
    const config = SPEAKER_CONFIG[segment.speaker] || SPEAKER_CONFIG.host;

    const utterance = new SpeechSynthesisUtterance(segment.text);
    utterance.pitch = config.pitch;
    utterance.rate = config.rate;
    utterance.volume = 1;

    // Use user-selected voice or fall back to auto-pick
    const targetURI = segment.speaker === 'host' ? hostVoiceURI : expertVoiceURI;
    if (targetURI) {
      const selectedVoice = availableVoices.find(v => v.voiceURI === targetURI);
      if (selectedVoice) utterance.voice = selectedVoice;
    } else {
      const voices = window.speechSynthesis.getVoices();
      const enVoices = voices.filter(v => v.lang.startsWith('en'));
      if (enVoices.length > 0) {
        const speakerOffset = segment.speaker === 'host' ? 0 : 1;
        utterance.voice = enVoices[speakerOffset % enVoices.length];
      }
    }

    utterance.onend = () => {
      const next = index + 1;
      setCurrentIndex(next);
      if (next < podcast.segments.length) {
        speak(next);
      } else {
        setIsPlaying(false);
        setHasStarted(false);
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [podcast.segments, hostVoiceURI, expertVoiceURI, availableVoices]);

  const handlePlay = useCallback(() => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else {
        setHasStarted(true);
        speak(currentIndex);
      }
      setIsPlaying(true);
    }
  }, [isPlaying, currentIndex, speak]);

  const handleRestart = useCallback(() => {
    window.speechSynthesis.cancel();
    setCurrentIndex(0);
    setIsPlaying(false);
    setHasStarted(false);
  }, []);

  const handleSkipForward = useCallback(() => {
    if (currentIndex >= podcast.segments.length - 1) return;
    window.speechSynthesis.cancel();
    const next = currentIndex + 1;
    setCurrentIndex(next);
    if (isPlaying) {
      speak(next);
    }
  }, [currentIndex, isPlaying, speak, podcast.segments.length]);

  const handleSkipBack = useCallback(() => {
    if (currentIndex <= 0) return;
    window.speechSynthesis.cancel();
    const prev = currentIndex - 1;
    setCurrentIndex(prev);
    if (isPlaying) {
      speak(prev);
    }
  }, [currentIndex, isPlaying, speak]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const currentSegment = podcast.segments[currentIndex];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-heading text-foreground">{podcast.title}</h2>
        {podcast.description && (
          <p className="text-body text-muted-foreground">{podcast.description}</p>
        )}
      </div>

      {/* Voice Settings */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <button
          onClick={() => setShowVoiceSettings(!showVoiceSettings)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-caption font-medium text-foreground">Voice Settings</span>
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${showVoiceSettings ? 'rotate-180' : ''}`} />
        </button>

        {showVoiceSettings && (
          <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border/40">
            <div className="grid grid-cols-2 gap-3">
              {/* Host voice */}
              <div className="space-y-1.5">
                <label className="text-overline text-muted-foreground">Host Voice</label>
                <div className="relative">
                  <select
                    value={hostVoiceURI}
                    onChange={(e) => setHostVoiceURI(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 pr-8 text-caption text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors cursor-pointer"
                  >
                    {availableVoices.length === 0 && (
                      <option value="">Loading voices...</option>
                    )}
                    {availableVoices.map((voice) => (
                      <option key={voice.voiceURI} value={voice.voiceURI}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              {/* Expert voice */}
              <div className="space-y-1.5">
                <label className="text-overline text-muted-foreground">Expert Voice</label>
                <div className="relative">
                  <select
                    value={expertVoiceURI}
                    onChange={(e) => setExpertVoiceURI(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 pr-8 text-caption text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors cursor-pointer"
                  >
                    {availableVoices.length === 0 && (
                      <option value="">Loading voices...</option>
                    )}
                    {availableVoices.map((voice) => (
                      <option key={voice.voiceURI} value={voice.voiceURI}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground/60">Select different voices for each speaker to distinguish them during playback.</p>
          </div>
        )}
      </div>

      {/* Player Controls */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        {/* Now Playing */}
        {currentSegment && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${SPEAKER_CONFIG[currentSegment.speaker]?.color || ''}`}>
                <Volume2 className="h-3 w-3" />
                {SPEAKER_CONFIG[currentSegment.speaker]?.label || currentSegment.speaker}
              </span>
              <span className="text-caption text-muted-foreground">
                {SEGMENT_TYPE_LABELS[currentSegment.type] || currentSegment.type}
              </span>
            </div>
            <p className="text-body text-foreground leading-relaxed line-clamp-3">
              {currentSegment.text}
            </p>
          </div>
        )}

        {/* Progress & Controls */}
        <div className="space-y-3">
          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <span className="text-overline text-muted-foreground tabular-nums min-w-[3rem]">
              {currentIndex + 1} / {podcast.segments.length}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${((currentIndex + (isPlaying ? 0.5 : 0)) / podcast.segments.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Transport controls */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={handleRestart}
              disabled={!hasStarted && currentIndex === 0}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={handleSkipBack}
              disabled={currentIndex === 0}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full border-primary/30 hover:bg-primary/10 hover:text-primary"
              onClick={handlePlay}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={handleSkipForward}
              disabled={currentIndex >= podcast.segments.length - 1}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Segment List */}
      <div className="space-y-2">
        <p className="text-overline text-muted-foreground">Segments</p>
        <div ref={segmentListRef} className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
          {podcast.segments.map((seg, i) => {
            const isActive = i === currentIndex;
            const isPast = i < currentIndex;
            const config = SPEAKER_CONFIG[seg.speaker] || SPEAKER_CONFIG.host;

            return (
              <button
                key={i}
                data-active={isActive}
                onClick={() => {
                  window.speechSynthesis.cancel();
                  setCurrentIndex(i);
                  if (isPlaying) speak(i);
                }}
                className={`w-full text-left rounded-lg border p-3 transition-all cursor-pointer
                  ${isActive
                    ? 'border-primary/30 bg-primary/5 shadow-sm'
                    : isPast
                      ? 'border-border/50 bg-muted/20 opacity-60'
                      : 'border-border hover:border-primary/15 hover:bg-accent/20'
                  }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-overline text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                  <span className={`rounded-full border px-2 py-0 text-[10px] font-semibold uppercase tracking-wide ${config.color}`}>
                    {config.label}
                  </span>
                  <span className="text-caption text-muted-foreground/60">
                    {SEGMENT_TYPE_LABELS[seg.type] || seg.type}
                  </span>
                  {isActive && isPlaying && (
                    <span className="ml-auto flex gap-0.5">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </span>
                  )}
                </div>
                <p className="text-caption text-foreground/80 line-clamp-2 leading-relaxed">{seg.text}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
