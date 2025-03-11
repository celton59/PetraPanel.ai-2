import React, { ButtonHTMLAttributes } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StandardSearchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'secondary' | 'ghost' | 'outline';
  iconOnly?: boolean;
  disabled?: boolean;
}

export function StandardSearchButton({
  className,
  size = 'default',
  variant = 'default',
  iconOnly = false,
  disabled = false,
  onClick,
  ...props
}: StandardSearchButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'gap-2 h-10 py-2 text-base font-medium',
        iconOnly ? 'px-3' : 'px-4',
        className
      )}
      {...props}
    >
      <Search className="h-5 w-5" />
      {!iconOnly && <span>Buscar</span>}
    </Button>
  );
}