import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { ModelConfig } from '@/types/model-settings'

const STORAGE_KEY = 'arcgentic_model_config'

interface ModelSettingsContextValue {
  /** Current saved config (null = not configured, use ENV fallback) */
  modelConfig: ModelConfig | null
  /** Save config to localStorage */
  setModelConfig: (config: ModelConfig) => void
  /** Clear config from localStorage */
  clearModelConfig: () => void
  /** Whether a config is saved */
  isConfigured: boolean
  /** Whether the settings modal is open */
  isSettingsOpen: boolean
  /** Open the settings modal (optionally with an error message) */
  openSettings: (errorMessage?: string) => void
  /** Close the settings modal */
  closeSettings: () => void
  /** Error message to display in the modal */
  settingsError: string | null
}

const ModelSettingsContext = createContext<ModelSettingsContextValue | null>(null)

export function ModelSettingsProvider({ children }: { children: ReactNode }) {
  const [modelConfig, setModelConfigState] = useState<ModelConfig | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)

  const setModelConfig = useCallback((config: ModelConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    setModelConfigState(config)
  }, [])

  const clearModelConfig = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setModelConfigState(null)
  }, [])

  const openSettings = useCallback((errorMessage?: string) => {
    if (errorMessage) setSettingsError(errorMessage)
    setIsSettingsOpen(true)
  }, [])

  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false)
    setSettingsError(null)
  }, [])

  return (
    <ModelSettingsContext.Provider
      value={{
        modelConfig,
        setModelConfig,
        clearModelConfig,
        isConfigured: modelConfig !== null,
        isSettingsOpen,
        openSettings,
        closeSettings,
        settingsError,
      }}
    >
      {children}
    </ModelSettingsContext.Provider>
  )
}

// ─── Hook ───

export function useModelSettings() {
  const ctx = useContext(ModelSettingsContext)
  if (!ctx) throw new Error('useModelSettings must be used within ModelSettingsProvider')
  return ctx
}

// ─── Utility: get config for API calls ───

export function getStoredModelConfig(): ModelConfig | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

/**
 * Convert FE ModelConfig to the snake_case dict expected by the agent service.
 */
export function toApiModelConfig(config: ModelConfig) {
  return {
    provider: config.provider,
    model: config.model,
    api_key: config.apiKey,
    base_url: config.baseUrl,
    temperature: config.temperature,
    top_p: config.topP,
  }
}
