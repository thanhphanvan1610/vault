'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, RefreshCw } from 'lucide-react'
import { cryptoService } from '@/lib/crypto-service'
import { useVaultStore } from '@/lib/store'

export function AddPasswordDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  
  const addEntry = useVaultStore((state) => state.addEntry)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    addEntry({
      title,
      username,
      password,
      url,
      notes
    })
    
    // Reset form
    setTitle('')
    setUsername('')
    setPassword('')
    setUrl('')
    setNotes('')
    setIsOpen(false)
  }

  const generatePassword = () => {
    const newPassword = cryptoService.generatePassword(16, true)
    setPassword(newPassword)
  }

  const getPasswordStrength = (password: string) => {
    let score = 0
    const checks = [
      password.length >= 12,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*(),.?":{}|<>-]/.test(password)
    ]
    
    score = checks.filter(Boolean).length
    
    if (score < 3) return { strength: 'Weak', color: 'text-red-500' }
    if (score < 5) return { strength: 'Medium', color: 'text-yellow-500' }
    return { strength: 'Strong', color: 'text-green-500' }
  }

  const passwordStrength = password ? getPasswordStrength(password) : null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Password
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Password</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-title">Title *</Label>
            <Input
              id="add-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Gmail, GitHub, Netflix"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="add-username">Username/Email</Label>
            <Input
              id="add-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your@email.com or username"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="add-password">Password *</Label>
            <div className="flex space-x-2">
              <Input
                id="add-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter or generate password"
                required
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={generatePassword}
                title="Generate secure password"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            {passwordStrength && (
              <div className="flex items-center justify-between text-sm">
                <span>Strength:</span>
                <span className={passwordStrength.color}>{passwordStrength.strength}</span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="add-url">Website URL</Label>
            <Input
              id="add-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="add-notes">Notes</Label>
            <Textarea
              id="add-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information..."
              rows={3}
            />
          </div>
          
          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Add Password
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}