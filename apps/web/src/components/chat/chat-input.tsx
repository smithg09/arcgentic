import { useState, useRef, useCallback } from 'react';
import { ArrowUp, Paperclip, X, FileText, Square, Link2, Plus } from 'lucide-react';
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

interface ChatInputProps {
  onSend: (message: string, files?: File[], urls?: string[]) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, onStop, isStreaming, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkInputs, setLinkInputs] = useState<string[]>(['']);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    if (isStreaming) {
      onStop?.();
      return;
    }
    const trimmed = message.trim();
    if (!trimmed && files.length === 0 && urls.length === 0) return;
    onSend(trimmed, files.length > 0 ? files : undefined, urls.length > 0 ? urls : undefined);
    setMessage('');
    setFiles([]);
    setUrls([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message, files, urls, isStreaming, onSend, onStop]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  const handleAddLinks = useCallback(() => {
    const validUrls = linkInputs.map((l) => l.trim()).filter(Boolean);
    if (validUrls.length > 0) {
      setUrls((u) => [...u, ...validUrls]);
      setLinkInputs(['']);
      setIsLinkDialogOpen(false);
    }
  }, [linkInputs]);

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
    <div className="sticky bg-background/10 backdrop-blur-[.4rem]
 bottom-0 p-4 md:p-6 z-20 ">
      <div
        className={`motion-focus-shell relative rounded-xl border border-input shadow-sm transition-all bg-background duration-200 focus-within:shadow-md overflow-hidden ${
          isDragging
            ? 'border-primary bg-primary/10'
            : 'focus-within:bg-background'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* File and URL previews */}
        {(files.length > 0 || urls.length > 0) && (
          <div className="motion-soft-in flex flex-wrap gap-2 px-3 pt-2.5">
            {files.map((file, i) => (
              <div
                key={`f-${i}`}
                className="motion-chip-in flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1 text-caption"
              >
                <FileText className="h-3 w-3 text-muted-foreground" />
                <span className="max-w-24 truncate">{file.name}</span>
                <button
                  onClick={() => setFiles((f) => f.filter((_, idx) => idx !== i))}
                  className="motion-press text-muted-foreground hover:text-foreground"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
            {urls.map((url, i) => (
              <div
                key={`u-${i}`}
                className="motion-chip-in flex items-center gap-1.5 rounded-md border border-border/50 bg-secondary/50 px-2 py-1 text-caption"
              >
                <Link2 className="h-3 w-3 text-muted-foreground" />
                <span className="max-w-24 truncate">{url}</span>
                <button
                  onClick={() => setUrls((u) => u.filter((_, idx) => idx !== i))}
                  className="motion-press text-muted-foreground hover:text-foreground"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            autoResize();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask a follow-up question..."
          rows={1}
          disabled={disabled}
          className="w-full resize-none bg-transparent px-3 pt-2.5 pb-12 text-body text-foreground placeholder:text-foreground/40 placeholder:font-normal focus:outline-none"
        />

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full border border-input shadow-sm transition-all hover:bg-accent hover:text-accent-foreground"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isStreaming}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.md,.csv"
              onChange={(e) => {
                if (e.target.files) setFiles((f) => [...f, ...Array.from(e.target.files!)]);
              }}
              className="hidden"
            />

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full border border-input shadow-sm transition-all hover:bg-accent hover:text-accent-foreground"
              onClick={() => setIsLinkDialogOpen(true)}
              disabled={disabled || isStreaming}
            >
              <Link2 className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={
              disabled ||
              (!isStreaming && !message.trim() && files.length === 0 && urls.length === 0)
            }
            size="icon"
            className="h-8 w-8 shrink-0 rounded-full border border-input shadow-sm transition-all hover:bg-accent hover:text-accent-foreground"
            variant={isStreaming ? 'destructive' : 'default'}
          >
            {isStreaming ? <Square className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
          </Button>
        </div>
      </div>

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
