'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Eye, 
  EyeOff, 
  Copy, 
  Edit2, 
  Trash2, 
  ExternalLink,
  RefreshCw,
  Check
} from 'lucide-react'
import { PasswordEntry as PasswordEntryType } from '@/lib/crypto-service'
import { cryptoService } from '@/lib/crypto-service'
import { clipboardService } from '@/lib/clipboard-service'
import { useVaultStore } from '@/lib/store'
import { Badge } from '@/components/ui/badge'

interface PasswordEntryProps {
  entry: PasswordEntryType
}

export function PasswordEntry({ entry }: PasswordEntryProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedEntry, setEditedEntry] = useState(entry)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  
  const { updateEntry, deleteEntry } = useVaultStore()

  const handleCopy = async (text: string, field: string) => {
    const success = await clipboardService.copyToClipboard(text)
    if (success) {
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    }
  }

  const handleSave = () => {
    updateEntry(entry.id, editedEntry)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedEntry(entry)
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this password entry?')) {
      deleteEntry(entry.id)
    }
  }

  const generateNewPassword = () => {
    const newPassword = cryptoService.generatePassword(16, true)
    setEditedEntry({ ...editedEntry, password: newPassword })
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
    
    if (score < 3) return { strength: 'Weak', color: 'bg-red-500' }
    if (score < 5) return { strength: 'Medium', color: 'bg-yellow-500' }
    return { strength: 'Strong', color: 'bg-green-500' }
  }

  const passwordStrength = getPasswordStrength(entry.password)

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{entry.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{entry.username}</p>
            {entry.url && (
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-blue-600 hover:text-blue-800"
                onClick={() => window.open(entry.url, '_blank')}
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                {entry.url}
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Password Entry</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={editedEntry.title}
                      onChange={(e) => setEditedEntry({ ...editedEntry, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username/Email</Label>
                    <Input
                      id="username"
                      value={editedEntry.username}
                      onChange={(e) => setEditedEntry({ ...editedEntry, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="password"
                        type="password"
                        value={editedEntry.password}
                        onChange={(e) => setEditedEntry({ ...editedEntry, password: e.target.value })}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={generateNewPassword}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url">Website URL</Label>
                    <Input
                      id="url"
                      value={editedEntry.url}
                      onChange={(e) => setEditedEntry({ ...editedEntry, url: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={editedEntry.notes}
                      onChange={(e) => setEditedEntry({ ...editedEntry, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-red-500 hover:text-red-700"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Password Field */}
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={entry.password}
                readOnly
                className="pr-20 font-mono"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleCopy(entry.password, 'password')}
                >
                  {copiedField === 'password' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={`${passwordStrength.color} text-white`}
            >
              {passwordStrength.strength}
            </Badge>
          </div>

          {/* Username/Email with copy */}
          {entry.username && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground w-16">User:</span>
              <span className="flex-1 text-sm">{entry.username}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleCopy(entry.username, 'username')}
              >
                {copiedField === 'username' ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}

          {/* Notes */}
          {entry.notes && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">{entry.notes}</p>
            </div>
          )}

          {/* Created/Updated dates */}
          <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
            <span>Created: {new Date(entry.created_at).toLocaleDateString()}</span>
            <span>Updated: {new Date(entry.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}