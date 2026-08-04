import { useState, type ComponentProps } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '#/lib/utils'

type PasswordInputProps = Omit<ComponentProps<'input'>, 'type'> & {
  /** Extra classes for the wrapper around input + toggle */
  wrapperClassName?: string
}

export function PasswordInput({ className, wrapperClassName, ...props }: PasswordInputProps) {
  const [show, setShow] = useState(false)

  return (
    <div className={cn('relative w-full', wrapperClassName)}>
      <input
        {...props}
        type={show ? 'text' : 'password'}
        className={cn('w-full pr-11', className)}
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] transition-colors hover:text-dq-black"
        onClick={() => setShow((value) => !value)}
        aria-label={show ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
      </button>
    </div>
  )
}
