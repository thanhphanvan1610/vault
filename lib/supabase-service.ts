/**
 * FortressPass Supabase Service
 * 
 * This service handles all server interactions with Supabase.
 * It maintains the zero-knowledge principle by only storing
 * encrypted blobs and authentication metadata.
 */

import { supabase, UserVault } from './supabase'
import { User } from '@supabase/supabase-js'

export class SupabaseService {
  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }

  /**
   * Sign up new user with email/password
   */
  async signUp(email: string, password: string): Promise<{ user: User | null; error: any }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { user: data.user, error }
  }

  /**
   * Sign in existing user
   */
  async signIn(email: string, password: string): Promise<{ user: User | null; error: any }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { user: data.user, error }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    await supabase.auth.signOut()
  }

  /**
   * Create initial vault for new user
   * Stores the encrypted vault blob and salt for key derivation
   */
  async createVault(encryptedVault: string, salt: string): Promise<{ error: any }> {
    const user = await this.getCurrentUser()
    if (!user) {
      return { error: new Error('User not authenticated') }
    }

    const { error } = await supabase
      .from('user_vaults')
      .insert({
        user_id: user.id,
        encrypted_vault: encryptedVault,
        salt: salt,
      })

    return { error }
  }

  /**
   * Retrieve user's vault data (encrypted blob + salt)
   */
  async getVault(): Promise<{ vault: UserVault | null; error: any }> {
    const user = await this.getCurrentUser()
    if (!user) {
      return { vault: null, error: new Error('User not authenticated') }
    }

    const { data, error } = await supabase
      .from('user_vaults')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return { vault: data, error }
  }

  /**
   * Update vault with new encrypted data
   */
  async updateVault(encryptedVault: string): Promise<{ error: any }> {
    const user = await this.getCurrentUser()
    if (!user) {
      return { error: new Error('User not authenticated') }
    }

    const { error } = await supabase
      .from('user_vaults')
      .update({ 
        encrypted_vault: encryptedVault,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    return { error }
  }

  /**
   * Check if user has an existing vault
   */
  async hasVault(): Promise<boolean> {
    const { vault } = await this.getVault()
    return vault !== null
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

export const supabaseService = new SupabaseService()