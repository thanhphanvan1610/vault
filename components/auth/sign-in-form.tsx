'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield } from 'lucide-react'
import { supabaseService } from '@/lib/supabase-service'
import { useAuthStore } from '@/lib/store'

export function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()
  const setUser = useAuthStore((state) => state.setUser)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { user, error } = await supabaseService.signIn(email, password)
      
      if (error) {
        setError(error.message)
        return
      }

      if (user) {
        setUser(user)
        router.push('/vault')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your FortressPass account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Account Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your account password"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                This is different from your Master Password used to encrypt your vault.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={() => router.push('/auth/sign-up')}
            >
              Sign up
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}