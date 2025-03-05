import React from 'react';
import { Search, Command } from 'lucide-react';
import { useGlobalSearch } from '@/hooks/use-global-search';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchButtonProps {
  className?: string;
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'secondary' | 'ghost' | 'outline';
  showShortcut?: boolean;
  iconOnly?: boolean;
}

export function SearchButton({
  className,
  size = 'default',
  variant = 'outline',
  showShortcut = true,
  iconOnly = false,
}: SearchButtonProps) {
  const { openSearch } = useGlobalSearch();
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={openSearch}
      className={cn(
        'gap-2',
        iconOnly && 'px-2',
        className
      )}
    >
      <Search className="h-4 w-4" />
      {!iconOnly && <span>Buscar</span>}
      {showShortcut && !iconOnly && (
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">
            {navigator.userAgent.indexOf('Mac') !== -1 ? '⌘' : 'Ctrl'}
          </span>
          <span className="text-xs">K</span>
        </kbd>
      )}
    </Button>
  );
}