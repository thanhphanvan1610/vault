/**
 * FortressPass Application State Store
 * 
 * Manages client-side application state using Zustand.
 * All sensitive data operations happen through this store.
 */

import { create } from 'zustand'
import { VaultData, PasswordEntry } from './crypto-service'
import { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
}

interface VaultState {
  isUnlocked: boolean
  vaultData: VaultData | null
  isLoading: boolean
  error: string | null
  setUnlocked: (unlocked: boolean) => void
  setVaultData: (data: VaultData | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  addEntry: (entry: Omit<PasswordEntry, 'id' | 'created_at' | 'updated_at'>) => void
  updateEntry: (id: string, updates: Partial<PasswordEntry>) => void
  deleteEntry: (id: string) => void
  clearVault: () => void
}

interface UIState {
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  searchQuery: string
  toggleTheme: () => void
  setSidebarOpen: (open: boolean) => void
  setSearchQuery: (query: string) => void
}

// Auth Store
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
}))

// Vault Store
export const useVaultStore = create<VaultState>((set, get) => ({
  isUnlocked: false,
  vaultData: null,
  isLoading: false,
  error: null,
  setUnlocked: (unlocked) => set({ isUnlocked: unlocked }),
  setVaultData: (data) => set({ vaultData: data }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  addEntry: (entry) => {
    const state = get()
    if (!state.vaultData) return

    const newEntry: PasswordEntry = {
      ...entry,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const updatedVault: VaultData = {
      ...state.vaultData,
      entries: [...state.vaultData.entries, newEntry],
      updated_at: new Date().toISOString(),
    }

    set({ vaultData: updatedVault })
  },

  updateEntry: (id, updates) => {
    const state = get()
    if (!state.vaultData) return

    const updatedEntries = state.vaultData.entries.map(entry =>
      entry.id === id 
        ? { ...entry, ...updates, updated_at: new Date().toISOString() }
        : entry
    )

    const updatedVault: VaultData = {
      ...state.vaultData,
      entries: updatedEntries,
      updated_at: new Date().toISOString(),
    }

    set({ vaultData: updatedVault })
  },

  deleteEntry: (id) => {
    const state = get()
    if (!state.vaultData) return

    const filteredEntries = state.vaultData.entries.filter(entry => entry.id !== id)

    const updatedVault: VaultData = {
      ...state.vaultData,
      entries: filteredEntries,
      updated_at: new Date().toISOString(),
    }

    set({ vaultData: updatedVault })
  },

  clearVault: () => set({ 
    isUnlocked: false, 
    vaultData: null, 
    error: null 
  }),
}))

// UI Store
export const useUIStore = create<UIState>((set) => ({
  theme: 'light',
  sidebarOpen: false,
  searchQuery: '',
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}))