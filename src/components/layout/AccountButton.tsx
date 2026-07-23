import { Link } from '@tanstack/react-router'
import { User } from 'lucide-react'
import { useDonorAuth } from '#/contexts/DonorAuthContext'
import { cn } from '#/lib/utils'

export function AccountButton({ className }: { className?: string }) {
  const { user, loading } = useDonorAuth()

  if (loading) return null

  return (
    <Link
      to={user ? '/account/orders' : '/account/login'}
      className={cn(
        'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dq-border text-dq-black transition-colors hover:border-dq-gold hover:text-dq-gold',
        className,
      )}
      aria-label={user ? 'My gifts' : 'Sign in'}
    >
      <User className="h-4 w-4" />
    </Link>
  )
}
