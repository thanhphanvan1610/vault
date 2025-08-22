'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, Fingerprint } from 'lucide-react'
import { cryptoService } from '@/lib/crypto-service'
import { supabaseService } from '@/lib/supabase-service'
import { webAuthnService } from '@/lib/webauthn-service'
import { useAuthStore, useVaultStore } from '@/lib/store'

export function UnlockVault() {
  const [masterPassword, setMasterPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isWebAuthnLoading, setIsWebAuthnLoading] = useState(false)
  const [error, setError] = useState('')
  const [canUseWebAuthn, setCanUseWebAuthn] = useState(false)
  
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const { setVaultData, setUnlocked } = useVaultStore()

  useEffect(() => {
    checkWebAuthnAvailability()
    cryptoService.initialize()
  }, [])

  const checkWebAuthnAvailability = async () => {
    const isSupported = webAuthnService.isSupported()
    const isAvailable = await webAuthnService.isPlatformAuthenticatorAvailable()
    
    // Check if user has registered WebAuthn credential
    const hasCredential = localStorage.getItem(`webauthn_${user?.id}`)
    
    setCanUseWebAuthn(isSupported && isAvailable && !!hasCredential)
  }

  const handleUnlockWithPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    await unlockVault(masterPassword)
  }

  const handleUnlockWithWebAuthn = async () => {
    if (!user) return
    
    setIsWebAuthnLoading(true)
    setError('')

    try {
      const credentialId = localStorage.getItem(`webauthn_${user.id}`)
      if (!credentialId) {
        throw new Error('No WebAuthn credential found')
      }

      // Authenticate with WebAuthn
      const { signature, authenticatorData } = await webAuthnService.authenticateCredential(credentialId)
      
      // Derive key from WebAuthn data
      const webAuthnKey = await webAuthnService.deriveKeyFromWebAuthn(signature, authenticatorData)
      
      // Get wrapped master key from localStorage
      const wrappedKey = localStorage.getItem(`wrapped_key_${user.id}`)
      if (!wrappedKey) {
        throw new Error('No wrapped master key found')
      }

      // Unwrap master key
      await cryptoService.unwrapMasterKeyFromWebAuthn(wrappedKey, webAuthnKey)
      
      // Load and decrypt vault
      await loadVault()
      
    } catch (err: any) {
      setError('WebAuthn unlock failed: ' + err.message)
    } finally {
      setIsWebAuthnLoading(false)
    }
  }

  const unlockVault = async (password: string) => {
    setIsLoading(true)
    setError('')

    try {
      // Get vault data from server
      const { vault, error } = await supabaseService.getVault()
      
      if (error) {
        setError('Failed to load vault: ' + error.message)
        return
      }

      if (!vault) {
        setError('No vault found for this user')
        return
      }

      // Derive master key from password
      await cryptoService.deriveMasterKey(password, vault.salt)
      
      // Decrypt vault
      const decryptedVault = cryptoService.decryptVault(vault.encrypted_vault)
      
      // Update app state
      setVaultData(decryptedVault)
      setUnlocked(true)
      
      // Redirect to vault
      router.push('/vault')
      
    } catch (err: any) {
      setError(err.message || 'Failed to unlock vault')
    } finally {
      setIsLoading(false)
    }
  }

  const loadVault = async () => {
    try {
      // Get vault data from server
      const { vault, error } = await supabaseService.getVault()
      
      if (error || !vault) {
        throw new Error('Failed to load vault data')
      }

      // Decrypt vault with already available master key
      const decryptedVault = cryptoService.decryptVault(vault.encrypted_vault)
      
      // Update app state
      setVaultData(decryptedVault)
      setUnlocked(true)
      
      // Redirect to vault
      router.push('/vault')
      
    } catch (err: any) {
      throw new Error('Failed to decrypt vault: ' + err.message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Unlock Your Vault</CardTitle>
          <CardDescription>
            Enter your Master Password to decrypt your vault
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {canUseWebAuthn && (
              <div className="space-y-3">
                <Button
                  onClick={handleUnlockWithWebAuthn}
                  className="w-full"
                  variant="outline"
                  disabled={isWebAuthnLoading || isLoading}
                >
                  {isWebAuthnLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {!isWebAuthnLoading && <Fingerprint className="mr-2 h-4 w-4" />}
                  Unlock with Biometrics
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or use password
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleUnlockWithPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="masterPassword">Master Password</Label>
                <Input
                  id="masterPassword"
                  type="password"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  placeholder="Enter your master password"
                  required
                  disabled={isLoading || isWebAuthnLoading}
                  autoFocus
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || isWebAuthnLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Unlock Vault
              </Button>
            </form>

            <div className="rounded-md bg-blue-50 p-3">
              <p className="text-xs text-blue-800">
                <strong>Zero-Knowledge Security:</strong> Your Master Password never leaves this device. 
                All decryption happens locally in your browser.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}