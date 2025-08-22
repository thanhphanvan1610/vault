'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { cryptoService, VaultData } from '@/lib/crypto-service'
import { supabaseService } from '@/lib/supabase-service'
import { useAuthStore, useVaultStore } from '@/lib/store'

export function MasterPasswordSetup() {
  const [masterPassword, setMasterPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [suggestion, setSuggestion] = useState('')
  
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const { setVaultData, setUnlocked } = useVaultStore()

  useEffect(() => {
    // Initialize crypto service
    cryptoService.initialize()
    generateSuggestion()
  }, [])

  const generateSuggestion = () => {
    const words = [
      'Quantum', 'Fortress', 'Phoenix', 'Thunder', 'Crystal', 'Summit',
      'Nebula', 'Prism', 'Velocity', 'Eclipse', 'Cosmos', 'Zenith'
    ]
    const numbers = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    const symbols = ['!', '@', '#', '$', '%', '^', '&', '*'][Math.floor(Math.random() * 8)]
    
    const suggestion = `${words[Math.floor(Math.random() * words.length)]}-${words[Math.floor(Math.random() * words.length)]}-${numbers}${symbols}`
    setSuggestion(suggestion)
  }

  const getPasswordStrength = (password: string) => {
    let score = 0
    const checks = [
      password.length >= 12,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*(),.?":{}|<>-]/.test(password),
      password.length >= 16
    ]
    
    score = checks.filter(Boolean).length
    
    if (score < 3) return { strength: 'Weak', color: 'text-red-500', bg: 'bg-red-500' }
    if (score < 5) return { strength: 'Medium', color: 'text-yellow-500', bg: 'bg-yellow-500' }
    return { strength: 'Strong', color: 'text-green-500', bg: 'bg-green-500' }
  }

  const passwordStrength = getPasswordStrength(masterPassword)
  const doPasswordsMatch = masterPassword === confirmPassword && masterPassword.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordStrength.strength === 'Weak') {
      setError('Please choose a stronger master password')
      return
    }
    
    if (!doPasswordsMatch) {
      setError('Passwords do not match')
      return
    }

    if (!user) {
      setError('User not authenticated')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Generate salt for key derivation
      const salt = cryptoService.generateSalt()
      
      // Derive master key from password
      await cryptoService.deriveMasterKey(masterPassword, salt)
      
      // Create initial empty vault
      const initialVault: VaultData = {
        entries: [],
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Encrypt vault
      const encryptedVault = cryptoService.encryptVault(initialVault)
      
      // Save to database
      const { error } = await supabaseService.createVault(encryptedVault, salt)
      
      if (error) {
        setError('Failed to create vault: ' + error.message)
        return
      }

      // Update app state
      setVaultData(initialVault)
      setUnlocked(true)
      
      // Redirect to vault
      router.push('/vault')
      
    } catch (err: any) {
      setError(err.message || 'Failed to setup vault')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Create Master Password</CardTitle>
          <CardDescription>
            Your Master Password encrypts all your data. Choose something strong and memorable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
              <h4 className="font-semibold text-amber-800 mb-2">🔐 Master Password Security</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• This password encrypts all your data locally</li>
                <li>• We cannot recover it if you forget it</li>
                <li>• Use 12+ characters with mixed case, numbers, symbols</li>
                <li>• Consider using a passphrase with 4+ random words</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="masterPassword">Master Password</Label>
              <div className="relative">
                <Input
                  id="masterPassword"
                  type={showPassword ? "text" : "password"}
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  placeholder="Enter a strong master password"
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              
              {masterPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Password Strength:</span>
                    <span className={passwordStrength.color}>{passwordStrength.strength}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${passwordStrength.bg} transition-all duration-300`}
                      style={{ 
                        width: passwordStrength.strength === 'Weak' ? '33%' : 
                               passwordStrength.strength === 'Medium' ? '66%' : '100%' 
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Master Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your master password"
                required
                disabled={isLoading}
              />
              {confirmPassword && (
                <p className={`text-xs ${doPasswordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                  Passwords {doPasswordsMatch ? 'match' : 'do not match'}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Need a suggestion?</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={suggestion}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={generateSuggestion}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setMasterPassword(suggestion)
                    setConfirmPassword(suggestion)
                  }}
                  disabled={isLoading}
                >
                  Use
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This is just a suggestion. Feel free to modify it or create your own.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || passwordStrength.strength === 'Weak' || !doPasswordsMatch}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Encrypted Vault
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}