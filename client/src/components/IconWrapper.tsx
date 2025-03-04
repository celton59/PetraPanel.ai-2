import React from 'react';
import { LucideProps } from 'lucide-react';

export const createIconWrapper = (IconComponent: React.FC<{ className?: string }>) => {
  const IconWrapper = React.forwardRef<SVGSVGElement, LucideProps>(
    ({ color = 'currentColor', size = 24, ...props }, ref) => {
      return (
        <IconComponent 
          className={props.className} 
          ref={ref} 
          {...props} 
        />
      );
    }
  );
  
  IconWrapper.displayName = 'IconWrapper';
  return IconWrapper;
};