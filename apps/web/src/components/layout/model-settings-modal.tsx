import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useModelSettings } from '@/hooks/use-model-settings'
import { PROVIDERS, DEFAULT_MODEL_CONFIG, type ModelConfig, type ProviderId } from '@/types/model-settings'
import { cn } from '@/lib/utils'
import {
  Sparkles,
  Cloud,
  Cpu,
  Globe,
  Server,
  Monitor,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertTriangle,
} from 'lucide-react'

const PROVIDER_ICONS: Record<ProviderId, React.ReactNode> = {
  openai: <Sparkles className="h-4 w-4" />,
  anthropic: <Cloud className="h-4 w-4" />,
  google: <Globe className="h-4 w-4" />,
  openrouter: <Server className="h-4 w-4" />,
  ollama: <Cpu className="h-4 w-4" />,
  lmstudio: <Monitor className="h-4 w-4" />,
}

export function ModelSettingsModal() {
  const {
    modelConfig,
    setModelConfig,
    clearModelConfig,
    isSettingsOpen,
    closeSettings,
    settingsError,
  } = useModelSettings()

  const [draft, setDraft] = useState<ModelConfig>(modelConfig ?? DEFAULT_MODEL_CONFIG)
  const [showKey, setShowKey] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Sync draft when modal opens
  useEffect(() => {
    if (isSettingsOpen) {
      setDraft(modelConfig ?? DEFAULT_MODEL_CONFIG)
      setShowKey(false)
    }
  }, [isSettingsOpen, modelConfig])

  const selectedProvider = PROVIDERS.find((p) => p.id === draft.provider)

  const handleProviderSelect = (id: ProviderId) => {
    const provider = PROVIDERS.find((p) => p.id === id)!
    setDraft((prev) => ({
      ...prev,
      provider: id,
      model: provider.models[0] || '',
      baseUrl: provider.defaultBaseUrl ?? '',
      apiKey: prev.provider === id ? prev.apiKey : '',
    }))
  }

  const handleSave = () => {
    setModelConfig(draft)
    closeSettings()
  }

  const handleClear = () => {
    clearModelConfig()
    setDraft(DEFAULT_MODEL_CONFIG)
  }

  const canSave =
    draft.provider &&
    draft.model &&
    (selectedProvider?.requiresApiKey ? draft.apiKey.trim() : true) &&
    (selectedProvider?.requiresBaseUrl ? draft.baseUrl.trim() : true)

  return (
    <Dialog open={isSettingsOpen} onOpenChange={(open) => !open && closeSettings()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Model Settings</DialogTitle>
          <DialogDescription>
            Configure your LLM provider and model. Settings are saved locally in your browser.
          </DialogDescription>
        </DialogHeader>

        {/* Error Banner */}
        {settingsError && (
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-2.5">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-destructive">{settingsError}</p>
          </div>
        )}

        {/* Provider Grid */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Provider
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PROVIDERS.map((prov) => (
              <button
                key={prov.id}
                onClick={() => handleProviderSelect(prov.id)}
                className={cn(
                  'flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition-all duration-150',
                  'hover:bg-muted/50 hover:border-foreground/20',
                  draft.provider === prov.id
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-border bg-card'
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-muted-foreground',
                      draft.provider === prov.id && 'text-primary'
                    )}
                  >
                    {PROVIDER_ICONS[prov.id]}
                  </span>
                  <span className="text-sm font-medium text-foreground">{prov.name}</span>
                </div>
                <span className="text-[11px] text-muted-foreground leading-tight">
                  {prov.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Model
          </label>
          <Input
            id="model-name-input"
            value={draft.model}
            onChange={(e) => setDraft((prev) => ({ ...prev, model: e.target.value }))}
            placeholder="e.g. gpt-4o"
          />
          {selectedProvider && selectedProvider.models.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {selectedProvider.models.map((m) => (
                <button
                  key={m}
                  onClick={() => setDraft((prev) => ({ ...prev, model: m }))}
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                    draft.model === m
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* API Key */}
        {selectedProvider?.requiresApiKey && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              API Key
            </label>
            <div className="relative">
              <Input
                id="api-key-input"
                type={showKey ? 'text' : 'password'}
                value={draft.apiKey}
                onChange={(e) => setDraft((prev) => ({ ...prev, apiKey: e.target.value }))}
                placeholder="sk-..."
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* Base URL */}
        {selectedProvider?.requiresBaseUrl && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Base URL
            </label>
            <Input
              id="base-url-input"
              value={draft.baseUrl}
              onChange={(e) => setDraft((prev) => ({ ...prev, baseUrl: e.target.value }))}
              placeholder={selectedProvider.defaultBaseUrl || 'https://...'}
            />
          </div>
        )}

        {/* Advanced Settings */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAdvanced ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
          Advanced Settings
        </button>

        {showAdvanced && (
          <div className="space-y-4 rounded-lg border border-border/60 bg-muted/20 p-3.5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Temperature</label>
                <span className="text-xs tabular-nums text-foreground/70">
                  {draft.temperature.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={draft.temperature}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, temperature: parseFloat(e.target.value) }))
                }
                className="w-full accent-primary h-1.5 rounded-full appearance-none bg-border cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Precise</span>
                <span>Creative</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Top P</label>
                <span className="text-xs tabular-nums text-foreground/70">
                  {draft.topP.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={draft.topP}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, topP: parseFloat(e.target.value) }))
                }
                className="w-full accent-primary h-1.5 rounded-full appearance-none bg-border cursor-pointer"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {modelConfig && (
            <Button variant="outline" size="sm" onClick={handleClear} className="mr-auto gap-1.5">
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={closeSettings}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!canSave}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
