'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Lock, Key, Fingerprint, Globe } from 'lucide-react'
import { supabaseService } from '@/lib/supabase-service'
import { useAuthStore } from '@/lib/store'

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { user, setUser } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    setIsLoading(true)
    const currentUser = await supabaseService.getCurrentUser()
    setUser(currentUser)
    
    if (currentUser) {
      // Check if user has a vault
      const hasVault = await supabaseService.hasVault()
      if (hasVault) {
        router.push('/vault/unlock')
      } else {
        router.push('/vault/setup')
      }
    }
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            FortressPass
            <span className="block text-2xl md:text-3xl font-normal text-blue-600 mt-2">
              Zero-Knowledge Password Manager
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Your passwords are encrypted locally before being stored. We can't see them, 
            hackers can't steal them, and you stay in complete control.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="px-8 py-3 text-lg"
              onClick={() => router.push('/auth/sign-up')}
            >
              Get Started Free
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-3 text-lg"
              onClick={() => router.push('/auth/sign-in')}
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Security Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Lock className="mx-auto h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Zero-Knowledge</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Your data is encrypted locally. We never have access to your passwords or master key.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Key className="mx-auto h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Military-Grade Encryption</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Argon2id key derivation with XChaCha20-Poly1305 authenticated encryption.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Fingerprint className="mx-auto h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Biometric Unlock</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Use your fingerprint or Face ID to unlock your vault securely and conveniently.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Globe className="mx-auto h-12 w-12 text-indigo-600 mb-4" />
              <CardTitle>Cross-Device Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Access your encrypted passwords from any device with secure cloud synchronization.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            How FortressPass Keeps You Safe
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Master Password</h3>
              <p className="text-gray-600">
                Your master password is the key to your vault. It never leaves your device.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Local Encryption</h3>
              <p className="text-gray-600">
                All data is encrypted in your browser before being sent to our servers.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Sync</h3>
              <p className="text-gray-600">
                Your encrypted vault syncs across devices while staying completely secure.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Built for Maximum Security</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">🔒 End-to-End Encryption</h3>
              <p className="text-blue-100">
                Your data is encrypted before it leaves your device and stays encrypted in the cloud.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">🔑 Zero-Knowledge Architecture</h3>
              <p className="text-blue-100">
                We literally cannot access your passwords even if we wanted to.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">🛡️ Open Source Security</h3>
              <p className="text-blue-100">
                Our security model is transparent and can be independently verified.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}