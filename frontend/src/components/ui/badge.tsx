import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'destructive';
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default:     'bg-blue-600 text-white',
  outline:     'border border-current bg-transparent',
  secondary:   'bg-gray-100 text-gray-700',
  destructive: 'bg-red-600 text-white',
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
