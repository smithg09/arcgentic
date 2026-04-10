import { useState, useRef, useCallback } from 'react';
import { ArrowUp, Paperclip, X, FileText, Link2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

interface HeroPromptProps {
  onSubmit: (message: string, files?: File[], urls?: string[]) => void;
  isLoading?: boolean;
}

export function HeroPrompt({ onSubmit, isLoading }: HeroPromptProps) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkInputs, setLinkInputs] = useState<string[]>(['']);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed && files.length === 0 && urls.length === 0) return;
    onSubmit(trimmed, files.length > 0 ? files : undefined, urls.length > 0 ? urls : undefined);
    setMessage('');
    setFiles([]);
    setUrls([]);
  }, [message, files, urls, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeUrl = (index: number) => {
    setUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddLinks = useCallback(() => {
    const validUrls = linkInputs.map((l) => l.trim()).filter(Boolean);
    if (validUrls.length > 0) {
      setUrls((u) => [...u, ...validUrls]);
      setLinkInputs(['']);
      setIsLinkDialogOpen(false);
    }
  }, [linkInputs]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!isDragging) setIsDragging(true);
    },
    [isDragging]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) {
      setFiles((f) => [...f, ...Array.from(e.dataTransfer.files)]);
    }
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl ml-0 text-left">
      {/* Animated glow behind the chat box */}
      <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-pulse-slow pointer-events-none" />
      <div
        className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-secondary-accent/10 blur-2xl animate-pulse-slow pointer-events-none"
        style={{ animationDelay: '1.5s' }}
      />

      {/* Headline */}
      <div className="mb-8 animate-in-up space-y-3 sm:mb-10" style={{ animationDelay: '0ms' }}>
        <h1 className="text-fluid-display font-black tracking-tight text-foreground max-w-[18ch]">
          Ask, Learn, Master.
        </h1>
        <p className="text-fluid-body text-muted-foreground max-w-[64ch]">
          Start a learning session on any topic. Your AI agent will research, teach, and create
          content tailored to you.
        </p>
      </div>

      {/* Chat box */}
      <div
        className={`group-focus-within animate-in-up relative rounded-3xl border border-input shadow-sm transition-all focus-within:-translate-y-0.5 focus-within:shadow-md duration-300 overflow-hidden ${isDragging ? 'border-primary bg-primary/10' : 'bg-card/95 backdrop-blur-sm'
          }`}
        style={{ animationDelay: '100ms' }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* File and URL previews */}
        {(files.length > 0 || urls.length > 0) && (
          <div className="flex flex-wrap gap-2 px-4 pt-3">
            {files.map((file, i) => (
              <div
                key={`f-${i}`}
                className="group flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5 text-caption"
              >
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="max-w-32 truncate text-foreground">{file.name}</span>
                <button
                  onClick={() => removeFile(i)}
                  className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {urls.map((url, i) => (
              <div
                key={`u-${i}`}
                className="group flex items-center gap-2 rounded-lg bg-secondary/80 border border-border/50 px-3 py-1.5 text-caption"
              >
                <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="max-w-32 truncate text-foreground">{url}</span>
                <button
                  onClick={() => removeUrl(i)}
                  className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            autoResize();
          }}
          onKeyDown={handleKeyDown}
          placeholder="What do you want to learn today?"
          rows={3}
          className="w-full resize-none bg-transparent px-6 pt-6 pb-14 text-fluid-body text-foreground font-medium placeholder:text-foreground/40 focus:outline-none placeholder:font-normal"
          disabled={isLoading}
        />

        {/* Subtle focus glow overlay */}
        <div
          className="absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 pointer-events-none
          bg-gradient-to-r from-primary/5 via-transparent to-secondary-accent/5
          group-focus-within:opacity-100"
        />

        {/* Bottom bar */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Upload */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full border border-primary/20 bg-primary/5 text-primary shadow-primary/10 transition-all hover:bg-primary/15 hover:border-primary/40"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.md,.csv"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* URL */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full border border-primary/20 bg-primary/5 text-primary shadow-primary/10 transition-all hover:bg-primary/15 hover:border-primary/40"
              onClick={() => setIsLinkDialogOpen(true)}
              disabled={isLoading}
            >
              <Link2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Send */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading || (!message.trim() && files.length === 0 && urls.length === 0)}
            size="icon"
            className="group-send h-10 w-10 shrink-0 rounded-full bg-primary text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:scale-105 active:scale-95"
          >
            <ArrowUp className="h-5 w-5 transition-transform duration-200 group-hover/parent:-translate-y-0.5" />
          </Button>
        </div>
      </div>

      {/* Keyboard hint */}
      <p
        className="mt-4 pl-2 text-sm font-medium text-muted-foreground animate-in-fade"
        style={{ animationDelay: '300ms' }}
      >
        ⌘ + Enter to send
      </p>

      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add URLs</DialogTitle>
            <DialogDescription>
              Enter links to webpages or documents you want the agent to use as sources.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
            {linkInputs.map((link, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  value={link}
                  onChange={(e) => {
                    const newInputs = [...linkInputs];
                    newInputs[index] = e.target.value;
                    setLinkInputs(newInputs);
                  }}
                  placeholder="https://example.com"
                  autoFocus={index === linkInputs.length - 1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (index === linkInputs.length - 1 && link.trim()) {
                        setLinkInputs([...linkInputs, '']);
                      } else if (e.metaKey || e.ctrlKey) {
                        handleAddLinks();
                      }
                    }
                  }}
                />
                {linkInputs.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={() => {
                      setLinkInputs(linkInputs.filter((_, i) => i !== index));
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => setLinkInputs([...linkInputs, ''])}
              disabled={!linkInputs[linkInputs.length - 1].trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add another URL
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLinks} disabled={!linkInputs.some((l) => l.trim())}>
              Add Links
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
