/**
 * Settings Store for Game of Strife
 *
 * Manages user-configurable game settings with AsyncStorage persistence.
 * Settings are loaded on app start and saved automatically when changed.
 *
 * Key Features:
 * - Persistent storage using React Native AsyncStorage
 * - Default values for all settings
 * - Backwards compatibility (merges stored settings with defaults)
 * - Reset to defaults functionality
 * - Always uses current default superpower lives (for balance updates)
 */
import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { DEFAULT_SUPERPOWER_LIVES } from '../utils/colors'

/**
 * Game configuration settings interface
 */
export interface GameSettings {
  /** Number of tokens each player can place (1-100) */
  tokensPerPlayer: number
  /** Board grid dimensions (NxN, typically 5-15) */
  boardSize: number
  /** Neighbor counts that cause birth ([3] = standard Conway) */
  birthRules: number[]
  /** Neighbor counts that allow survival ([2,3] = standard Conway) */
  survivalRules: number[]
  /** Enabled superpower type IDs (1-7) */
  enabledSuperpowers: number[]
  /** Chance of superpower spawn (0-50%) */
  superpowerPercentage: number
  /** Use arcade color theme (not yet implemented) */
  useArcadeTheme: boolean
  /** Simulation animation speed in ms per frame (10-500ms) */
  animationSpeed: number
  /** Wraparound board edges (toroidal topology) */
  enableToroidalBoard: boolean
  /** Lives per superpower type (0-7) */
  superpowerLives: Record<number, number>
  /** Show animated visual effects on superpowers */
  enableSuperpowerAnimations: boolean
  /** Allow newly born cells to inherit superpowers */
  enableSuperpowerBirth: boolean
}

export interface LogSession {
  sessionId: string
  timestamp: string
  expiresAt: string
  matchId?: string
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  boardSize: 10,
  tokensPerPlayer: 20,
  birthRules: [3],
  survivalRules: [2, 3],
  enabledSuperpowers: [1, 2, 3, 4, 5, 6, 7],
  superpowerPercentage: 20,
  useArcadeTheme: false,
  animationSpeed: 50, // 50ms per frame = 20fps (moderate speed)
  enableToroidalBoard: true,
  superpowerLives: DEFAULT_SUPERPOWER_LIVES,
  enableSuperpowerAnimations: true,
  enableSuperpowerBirth: true  // Allow superpowers during simulation by default
}

const SETTINGS_STORAGE_KEY = 'gameofstrife_settings'
const LOG_SESSIONS_STORAGE_KEY = 'gameofstrife_log_sessions'

// Load settings from AsyncStorage (async)
const loadSettingsFromStorage = async (): Promise<GameSettings> => {
  try {
    const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Merge with defaults to handle missing fields (backwards compatibility)
      // Always use default superpowerLives to ensure users get updated balance changes
      return {
        ...DEFAULT_GAME_SETTINGS,
        ...parsed,
        superpowerLives: DEFAULT_SUPERPOWER_LIVES  // Always use current defaults for lives
      }
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

// Load log sessions from AsyncStorage
const loadLogSessionsFromStorage = async (): Promise<LogSession[]> => {
  try {
    const stored = await AsyncStorage.getItem(LOG_SESSIONS_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as LogSession[]
    }
  } catch (error) {
    console.error('[SettingsStore] Failed to load log sessions:', error)
  }
  return []
}

// Save log sessions to AsyncStorage
const saveLogSessionsToStorage = async (sessions: LogSession[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(LOG_SESSIONS_STORAGE_KEY, JSON.stringify(sessions))
  } catch (error) {
    console.error('[SettingsStore] Failed to save log sessions:', error)
  }
}

interface SettingsStore {
  settings: GameSettings
  hasConfigured: boolean // Whether user has configured settings at least once
  isLoading: boolean
  logSessions: LogSession[]
  setSettings: (settings: GameSettings) => Promise<void>
  loadSettings: () => Promise<void>
  resetToDefaults: () => Promise<void>
  addLogSession: (session: LogSession) => Promise<void>
  loadLogSessions: () => Promise<void>
  clearLogSessions: () => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_GAME_SETTINGS,
  hasConfigured: false,
  isLoading: false,
  logSessions: [],

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
  },

  addLogSession: async (session: LogSession) => {
    const currentSessions = get().logSessions
    // Add new session at the beginning (most recent first)
    const updatedSessions = [session, ...currentSessions].slice(0, 20) // Keep only last 20
    set({ logSessions: updatedSessions })
    await saveLogSessionsToStorage(updatedSessions)
    console.log('[SettingsStore] Added log session:', session.sessionId)
  },

  loadLogSessions: async () => {
    try {
      const sessions = await loadLogSessionsFromStorage()
      set({ logSessions: sessions })
    } catch (error) {
      console.error('[SettingsStore] Error loading log sessions:', error)
    }
  },

  clearLogSessions: async () => {
    set({ logSessions: [] })
    await saveLogSessionsToStorage([])
    console.log('[SettingsStore] Cleared all log sessions')
  }
}))
