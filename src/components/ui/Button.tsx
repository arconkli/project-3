import React from 'react';
import { cn } from '@/lib/utils'; // Assuming you have a utility for merging class names

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean; // Optional: for composition with Slot
}

const buttonVariants = {
  base: 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  variants: {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  },
  sizes: {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-10 w-10',
  },
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    // Basic implementation without Slot for simplicity if asChild is not needed
    // If using Shadcn or Radix Slot, you'd handle `asChild` here.
    const Comp = 'button'; // Use 'button' by default

    // Combine base styles with variant and size styles
    const variantStyle = buttonVariants.variants[variant] || buttonVariants.variants.default;
    const sizeStyle = buttonVariants.sizes[size] || buttonVariants.sizes.default;

    return (
      <Comp
        className={cn(buttonVariants.base, variantStyle, sizeStyle, className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button }; // Default export might also work depending on setup 