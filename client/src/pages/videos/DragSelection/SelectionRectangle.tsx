import React from 'react';

interface SelectionRectangleProps {
  style: React.CSSProperties;
}

export function SelectionRectangle({ style }: SelectionRectangleProps) {
  if (!style.width || !style.height) {
    return null;
  }
  
  return (
    <div 
      className="selection-rectangle" 
      style={{
        ...style,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '4px',
        zIndex: 50,
        pointerEvents: 'none',
      }}
    />
  );
}