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
      <div className="motion-hero text-center mb-10">
        <div className="mx-auto mb-8 flex justify-center">
          <Logo className="h-16 w-16 shadow-lg" />
        </div>
        <h1 className="text-title text-foreground mb-3">
          Welcome to Arcgentic
        </h1>
        <p className="text-body text-muted-foreground font-light">
          Set up your profile to get started with personalized learning.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 motion-hero" style={{ animationDelay: '150ms' }}>
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
          className="w-full mt-3 shadow-md shadow-primary/15"
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
