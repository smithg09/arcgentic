import { useState } from 'react'
import { useCreateUser } from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight } from 'lucide-react'
import { Logo } from '@/components/ui/logo'

export function OnboardingForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const createUser = useCreateUser()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !role.trim()) return
    createUser.mutate({
      name: name.trim(),
      email: email.trim(),
      professional_role: role.trim(),
    })
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="animate-in-up text-center mb-8">
        <div className="mx-auto mb-6 flex justify-center">
          <Logo className="h-14 w-14 shadow-md ring-1 ring-border/10" />
        </div>
        <h1 className="text-title text-foreground mb-2">Welcome to Arcgentic</h1>
        <p className="text-body text-muted-foreground">
          Set up your profile to get started with personalized learning.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 animate-in-up" style={{ animationDelay: '100ms' }}>
        <div>
          <label htmlFor="name" className="text-caption font-medium text-foreground block mb-1.5">
            Name
          </label>
          <Input
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="text-caption font-medium text-foreground block mb-1.5">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="role" className="text-caption font-medium text-foreground block mb-1.5">
            Professional Role
          </label>
          <Input
            id="role"
            value={role}
            onChange={e => setRole(e.target.value)}
            placeholder="e.g. Software Engineer, Data Scientist"
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full mt-2"
          disabled={createUser.isPending || !name.trim() || !email.trim() || !role.trim()}
        >
          {createUser.isPending ? 'Creating...' : 'Get Started'}
          {!createUser.isPending && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>

        {createUser.isError && (
          <p className="text-caption text-destructive text-center">
            {createUser.error?.message || 'Failed to create account'}
          </p>
        )}
      </form>
    </div>
  )
}
