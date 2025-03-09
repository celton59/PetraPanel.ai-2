import React from 'react';

interface SelectionRectangleProps {
  style: React.CSSProperties;
}

export function SelectionRectangle({ style }: SelectionRectangleProps) {
  return (
    <div
      className="absolute bg-primary/10 border border-primary/30 rounded-sm z-50 pointer-events-none"
      style={style}
    />
  );
}