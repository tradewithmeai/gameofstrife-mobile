// Settings store for Game of Strife configuration (React Native)
import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface GameSettings {
  tokensPerPlayer: number
  boardSize: number
  birthRules: number[]
  survivalRules: number[]
  enabledSuperpowers: number[]
  superpowerPercentage: number
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  boardSize: 10,
  tokensPerPlayer: 20,
  birthRules: [3],
  survivalRules: [2, 3],
  enabledSuperpowers: [1, 2, 3, 4, 5, 6, 7],
  superpowerPercentage: 20
}

const SETTINGS_STORAGE_KEY = 'gameofstrife_settings'

// Load settings from AsyncStorage (async)
const loadSettingsFromStorage = async (): Promise<GameSettings> => {
  try {
    const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as GameSettings
    }
  } catch (error) {
    console.error('[SettingsStore] Failed to load settings from AsyncStorage:', error)
  }
  return DEFAULT_GAME_SETTINGS
}

// Save settings to AsyncStorage (async)
const saveSettingsToStorage = async (settings: GameSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('[SettingsStore] Failed to save settings to AsyncStorage:', error)
  }
}

interface SettingsStore {
  settings: GameSettings
  hasConfigured: boolean // Whether user has configured settings at least once
  isLoading: boolean
  setSettings: (settings: GameSettings) => Promise<void>
  loadSettings: () => Promise<void>
  resetToDefaults: () => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: DEFAULT_GAME_SETTINGS,
  hasConfigured: false,
  isLoading: false,

  setSettings: async (settings: GameSettings) => {
    set({ isLoading: true })
    await saveSettingsToStorage(settings)
    set({ settings, hasConfigured: true, isLoading: false })
  },

  loadSettings: async () => {
    set({ isLoading: true })
    try {
      const stored = await loadSettingsFromStorage()
      const storedValue = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY)
      const hasConfigured = storedValue !== null
      set({ settings: stored, hasConfigured, isLoading: false })
    } catch (error) {
      console.error('[SettingsStore] Error loading settings:', error)
      set({ isLoading: false })
    }
  },

  resetToDefaults: async () => {
    set({ isLoading: true })
    const defaults = DEFAULT_GAME_SETTINGS
    await saveSettingsToStorage(defaults)
    set({ settings: defaults, hasConfigured: true, isLoading: false })
  }
}))
