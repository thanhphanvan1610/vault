'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, Check } from 'lucide-react'
import { supabaseService } from '@/lib/supabase-service'
import { useAuthStore } from '@/lib/store'

export function SignUpForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()
  const setUser = useAuthStore((state) => state.setUser)

  const passwordRequirements = [
    { text: 'At least 8 characters', met: password.length >= 8 },
    { text: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { text: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { text: 'Contains number', met: /\d/.test(password) },
    { text: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ]

  const isPasswordValid = passwordRequirements.every(req => req.met)
  const doPasswordsMatch = password === confirmPassword && password.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isPasswordValid) {
      setError('Please meet all password requirements')
      return
    }
    
    if (!doPasswordsMatch) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const { user, error } = await supabaseService.signUp(email, password)
      
      if (error) {
        setError(error.message)
        return
      }

      if (user) {
        setUser(user)
        router.push('/vault/setup')
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
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>
            Join FortressPass for maximum security
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
                placeholder="Create a strong password"
                required
                disabled={isLoading}
              />
              <div className="space-y-1">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center text-xs">
                    <Check 
                      className={`mr-2 h-3 w-3 ${req.met ? 'text-green-500' : 'text-muted-foreground'}`}
                    />
                    <span className={req.met ? 'text-green-600' : 'text-muted-foreground'}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                disabled={isLoading}
              />
              {confirmPassword && (
                <div className="flex items-center text-xs">
                  <Check 
                    className={`mr-2 h-3 w-3 ${doPasswordsMatch ? 'text-green-500' : 'text-red-500'}`}
                  />
                  <span className={doPasswordsMatch ? 'text-green-600' : 'text-red-500'}>
                    Passwords {doPasswordsMatch ? 'match' : 'do not match'}
                  </span>
                </div>
              )}
            </div>

            <div className="rounded-md bg-blue-50 p-3">
              <p className="text-xs text-blue-800">
                <strong>Important:</strong> This account password is for authentication only. 
                You'll create a separate Master Password to encrypt your vault data.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !isPasswordValid || !doPasswordsMatch}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={() => router.push('/auth/sign-in')}
            >
              Sign in
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}