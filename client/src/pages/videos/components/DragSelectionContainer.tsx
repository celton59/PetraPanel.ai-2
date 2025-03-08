import React, { CSSProperties } from "react";

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
  // Función para generar el estilo CSS del rectángulo de selección
  const getSelectionRectStyle = (): CSSProperties => {
    if (!isDragging || !dragStartPosition || !dragCurrentPosition) {
      return {
        display: 'none'
      };
    }

    const left = Math.min(dragStartPosition.x, dragCurrentPosition.x);
    const top = Math.min(dragStartPosition.y, dragCurrentPosition.y);
    const width = Math.abs(dragCurrentPosition.x - dragStartPosition.x);
    const height = Math.abs(dragCurrentPosition.y - dragStartPosition.y);

    return {
      position: 'fixed',
      left,
      top,
      width,
      height,
      backgroundColor: 'rgba(59, 130, 246, 0.15)',
      border: '1px solid rgba(59, 130, 246, 0.6)',
      pointerEvents: 'none',
      zIndex: 50
    };
  };

  return (
    <div
      className="relative"
      onMouseDown={selectMode ? handleDragStart : undefined}
      onMouseMove={isDragging && selectMode ? handleDragMove : undefined}
      onMouseUp={isDragging && selectMode ? handleDragEnd : undefined}
      onMouseLeave={isDragging && selectMode ? handleDragEnd : undefined}
    >
      {/* Rectángulo de selección */}
      {selectMode && isDragging && (
        <div style={getSelectionRectStyle()} />
      )}
      
      {children}
    </div>
  );
}