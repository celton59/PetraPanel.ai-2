import React, { useState, useRef, CSSProperties } from "react";

interface DragSelectionContainerProps {
  children: React.ReactNode;
  isDragging: boolean;
  selectMode: boolean;
  dragStartPosition: { x: number; y: number } | null;
  dragCurrentPosition: { x: number; y: number } | null;
  handleDragStart: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleDragMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleDragEnd: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export function DragSelectionContainer({
  children,
  isDragging,
  selectMode,
  dragStartPosition,
  dragCurrentPosition,
  handleDragStart,
  handleDragMove,
  handleDragEnd
}: DragSelectionContainerProps) {
  const dragSelectionRef = useRef<HTMLDivElement>(null);

  // Calcular las coordenadas del rectángulo de selección
  const getSelectionRectStyle = (): CSSProperties => {
    if (!dragStartPosition || !dragCurrentPosition) return {};
    
    // Calcular coordenadas relativas al viewport
    const left = Math.min(dragStartPosition.x, dragCurrentPosition.x);
    const top = Math.min(dragStartPosition.y, dragCurrentPosition.y);
    const width = Math.abs(dragCurrentPosition.x - dragStartPosition.x);
    const height = Math.abs(dragCurrentPosition.y - dragStartPosition.y);
    
    // Calcular coordenadas relativas al contenedor (fixed para el viewport)
    return {
      position: 'fixed', // Posición fija respecto al viewport
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  };

  return (
    <div 
      className="relative"
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      {/* Rectángulo de selección */}
      {isDragging && selectMode && (
        <div
          ref={dragSelectionRef}
          className="fixed bg-primary/10 border border-primary/30 rounded-sm z-50 pointer-events-none"
          style={getSelectionRectStyle()}
        ></div>
      )}
      
      {children}
    </div>
  );
}