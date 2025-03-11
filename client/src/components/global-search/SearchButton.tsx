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
        'gap-2 h-10 py-2 text-base font-medium',
        iconOnly ? 'px-3' : 'px-4',
        className
      )}
    >
      <Search className="h-5 w-5" />
      {!iconOnly && <span>Buscar</span>}
      {showShortcut && !iconOnly && (
        <kbd className="pointer-events-none hidden h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-[11px] font-medium opacity-100 sm:flex">
          <span className="text-xs">
            {navigator.userAgent.indexOf('Mac') !== -1 ? '⌘' : 'Ctrl'}
          </span>
          <span className="text-xs">K</span>
        </kbd>
      )}
    </Button>
  );
}