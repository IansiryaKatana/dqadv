import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '#/lib/utils'

const buttonVariants = cva(
  'type-label inline-flex items-center justify-center gap-2 rounded-full transition-all duration-200 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-dq-gold disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        gold: 'bg-dq-gold text-dq-black hover:-translate-y-0.5 hover:shadow-md',
        black: 'bg-dq-black text-white hover:-translate-y-0.5 hover:bg-dq-soft-black hover:shadow-md',
        ghost: 'bg-transparent text-dq-black hover:bg-dq-cream',
        link: 'type-body rounded-none bg-transparent p-0 normal-case tracking-normal text-dq-gold hover:underline',
        outline: 'border-2 border-dq-gold bg-transparent text-dq-black hover:bg-dq-gold/10',
        outlineOnDark:
          'border-2 border-dq-gold bg-white text-dq-black hover:bg-white hover:text-dq-gold',
      },
      size: {
        sm: 'h-9 px-4',
        md: 'h-11 px-6',
        lg: 'h-12 px-8 text-sm',
        icon: 'h-10 w-10 rounded-full p-0',
      },
    },
    defaultVariants: {
      variant: 'gold',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
