'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Search, 
  Shield, 
  LogOut, 
  Settings, 
  Lock,
  Key,
  Globe,
  Clock
} from 'lucide-react'
import { PasswordEntry } from './password-entry'
import { AddPasswordDialog } from './add-password-dialog'
import { cryptoService } from '@/lib/crypto-service'
import { supabaseService } from '@/lib/supabase-service'
import { useAuthStore, useVaultStore, useUIStore } from '@/lib/store'
import { clipboardService } from '@/lib/clipboard-service'

export function VaultDashboard() {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState('')
  
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const { setUser } = useAuthStore()
  const { vaultData, clearVault, isUnlocked } = useVaultStore()
  const { searchQuery, setSearchQuery } = useUIStore()

  // Auto-save vault data when it changes
  useEffect(() => {
    if (vaultData && isUnlocked) {
      saveVault()
    }
  }, [vaultData, isUnlocked])

  // Filter entries based on search query
  const filteredEntries = vaultData?.entries.filter(entry => 
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.url.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const saveVault = async () => {
    if (!vaultData || !cryptoService.isMasterKeyAvailable()) return
    
    setIsSaving(true)
    setError('')

    try {
      const encryptedVault = cryptoService.encryptVault(vaultData)
      const { error } = await supabaseService.updateVault(encryptedVault)
      
      if (error) {
        setError('Failed to save vault: ' + error.message)
      } else {
        setLastSaved(new Date())
      }
    } catch (err: any) {
      setError('Failed to encrypt vault: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    // Clear sensitive data from memory
    cryptoService.clearMasterKey()
    clearVault()
    clipboardService.clearAllTimeouts()
    
    // Sign out from Supabase
    await supabaseService.signOut()
    setUser(null)
    
    router.push('/auth/sign-in')
  }

  const getVaultStats = () => {
    if (!vaultData) return { total: 0, weak: 0, strong: 0 }
    
    const total = vaultData.entries.length
    let weak = 0
    let strong = 0
    
    vaultData.entries.forEach(entry => {
      const password = entry.password
      let score = 0
      const checks = [
        password.length >= 12,
        /[a-z]/.test(password),
        /[A-Z]/.test(password),
        /\d/.test(password),
        /[!@#$%^&*(),.?":{}|<>-]/.test(password)
      ]
      
      score = checks.filter(Boolean).length
      
      if (score < 3) weak++
      else if (score >= 5) strong++
    })
    
    return { total, weak, strong }
  }

  const stats = getVaultStats()

  if (!isUnlocked || !vaultData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Vault is locked</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">FortressPass</h1>
                <p className="text-sm text-muted-foreground">
                  {user?.email}
                  {isSaving && ' • Saving...'}
                  {lastSaved && !isSaving && ` • Saved ${lastSaved.toLocaleTimeString()}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => router.push('/vault/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Lock Vault
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Passwords</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Strong Passwords</CardTitle>
              <Shield className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.strong}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weak Passwords</CardTitle>
              <Shield className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.weak}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {new Date(vaultData.updated_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Add */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search passwords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <AddPasswordDialog />
        </div>

        {/* Password Entries */}
        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {vaultData.entries.length === 0 ? 'No passwords yet' : 'No matching passwords'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {vaultData.entries.length === 0 
                    ? 'Add your first password to get started with FortressPass'
                    : 'Try adjusting your search terms'
                  }
                </p>
                {vaultData.entries.length === 0 && <AddPasswordDialog />}
              </CardContent>
            </Card>
          ) : (
            filteredEntries.map((entry) => (
              <PasswordEntry key={entry.id} entry={entry} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}