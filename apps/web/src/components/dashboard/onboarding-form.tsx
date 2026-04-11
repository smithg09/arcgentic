import { useState, useEffect } from 'react'
import { useCreateUser } from '@/hooks/use-user'
import { useModelSettings } from '@/hooks/use-model-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight, ArrowLeft, SkipForward, Sparkles, Cloud, Cpu, Globe, Server, Monitor, Eye, EyeOff } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { PROVIDERS, DEFAULT_MODEL_CONFIG, type ModelConfig, type ProviderId } from '@/types/model-settings'
import { AGENT_API_BASE } from '@/lib/constants'
import { cn } from '@/lib/utils'

const PROVIDER_ICONS: Record<ProviderId, React.ReactNode> = {
  openai: <Sparkles className="h-4 w-4" />,
  anthropic: <Cloud className="h-4 w-4" />,
  google: <Globe className="h-4 w-4" />,
  openrouter: <Server className="h-4 w-4" />,
  ollama: <Cpu className="h-4 w-4" />,
  lmstudio: <Monitor className="h-4 w-4" />,
}

export function OnboardingForm() {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const createUser = useCreateUser()
  const { setModelConfig } = useModelSettings()

  // Model config draft for step 2
  const [draft, setDraft] = useState<ModelConfig>(DEFAULT_MODEL_CONFIG)
  const [showKey, setShowKey] = useState(false)
  const [envProviders, setEnvProviders] = useState<Record<string, boolean>>({})
  const [envLoading, setEnvLoading] = useState(true)

  // Fetch ENV-configured providers on mount
  useEffect(() => {
    fetch(`${AGENT_API_BASE}/health/providers`)
      .then((r) => r.json())
      .then((data) => {
        setEnvProviders(data.providers || {})
        setEnvLoading(false)
      })
      .catch(() => setEnvLoading(false))
  }, [])

  const hasAnyEnvProvider = Object.values(envProviders).some(Boolean)

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !role.trim()) return
    setStep(2)
  }

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

  const handleComplete = (skipModelConfig: boolean) => {
    if (!skipModelConfig) {
      setModelConfig(draft)
    }
    createUser.mutate({
      name: name.trim(),
      email: email.trim(),
      professional_role: role.trim(),
    })
  }

  const selectedProvider = PROVIDERS.find((p) => p.id === draft.provider)
  const canSaveModel =
    draft.provider &&
    draft.model &&
    (selectedProvider?.requiresApiKey ? draft.apiKey.trim() : true) &&
    (selectedProvider?.requiresBaseUrl ? draft.baseUrl.trim() : true)

  return (
    <div className="mx-auto max-w-md">
      <div className="motion-hero text-center mb-10">
        <div className="mx-auto mb-8 flex justify-center">
          <Logo className="h-16 w-16 shadow-lg" />
        </div>
        <h1 className="text-title text-foreground mb-3">
          Welcome to Arcgentic
        </h1>
        <p className="text-body text-muted-foreground font-light">
          {step === 1
            ? 'Set up your profile to get started with personalized learning.'
            : 'Configure your AI model provider.'}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              s === step ? 'w-8 bg-primary' : 'w-1.5 bg-border',
              s < step && 'bg-primary/40'
            )}
          />
        ))}
      </div>

      {/* Step 1: Profile */}
      {step === 1 && (
        <form onSubmit={handleProfileSubmit} className="space-y-5 motion-hero" style={{ animationDelay: '150ms' }}>
          <div>
            <label htmlFor="name" className="text-caption font-medium text-foreground block mb-1.5">
              Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="text-caption font-medium text-foreground block mb-1.5">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="role" className="text-caption font-medium text-foreground block mb-1.5">
              Professional Role
            </label>
            <Input
              id="role"
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="e.g. Software Engineer, Data Scientist"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full mt-3 shadow-md shadow-primary/15"
            disabled={!name.trim() || !email.trim() || !role.trim()}
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      )}

      {/* Step 2: Model Configuration */}
      {step === 2 && (
        <div className="space-y-5 motion-hero" style={{ animationDelay: '100ms' }}>
          {/* Provider Grid */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Provider
            </label>
            <div className="grid grid-cols-2 gap-2">
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
                    <span className={cn('text-muted-foreground', draft.provider === prov.id && 'text-primary')}>
                      {PROVIDER_ICONS[prov.id]}
                    </span>
                    <span className="text-sm font-medium text-foreground">{prov.name}</span>
                    {envProviders[prov.id] && (
                      <span className="text-[9px] font-medium uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                        ENV
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground leading-tight">
                    {prov.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Model */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Model
            </label>
            <Input
              value={draft.model}
              onChange={(e) => setDraft((prev) => ({ ...prev, model: e.target.value }))}
              placeholder="e.g. gpt-4o"
            />
            {selectedProvider && selectedProvider.models.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedProvider.models.slice(0, 4).map((m) => (
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
                value={draft.baseUrl}
                onChange={(e) => setDraft((prev) => ({ ...prev, baseUrl: e.target.value }))}
                placeholder={selectedProvider.defaultBaseUrl || 'https://...'}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <div className="flex-1" />

            {hasAnyEnvProvider && (
              <Button
                variant="ghost"
                onClick={() => handleComplete(true)}
                disabled={createUser.isPending}
                className="gap-1.5 text-muted-foreground"
              >
                <SkipForward className="h-4 w-4" />
                Skip
              </Button>
            )}

            <Button
              onClick={() => handleComplete(false)}
              disabled={!canSaveModel || createUser.isPending}
              className="shadow-md shadow-primary/15"
            >
              {createUser.isPending ? 'Creating...' : 'Get Started'}
              {!createUser.isPending && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>

          {createUser.isError && (
            <p className="text-caption text-destructive text-center">
              {createUser.error?.message || 'Failed to create account'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
