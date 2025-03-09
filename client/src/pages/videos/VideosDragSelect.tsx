/**
 * Este archivo contiene un hook para la selección por arrastre
 */

import { useState, useRef, useCallback, useEffect } from 'react';

interface Position {
  x: number;
  y: number;
}

interface SelectionRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

interface DragSelectOptions {
  onSelectionChange: (selectedIds: number[], isDeselecting: boolean) => void;
  elementSelector?: string;
  idAttribute?: string;
  scrollThreshold?: number;
  baseScrollSpeed?: number;
  minSelectionSize?: number;
}

export function useDragSelect({
  onSelectionChange,
  elementSelector = '.video-card',
  idAttribute = 'data-video-id',
  scrollThreshold = 60,
  baseScrollSpeed = 10,
  minSelectionSize = 4
}: DragSelectOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState<Position | null>(null);
  const [currentPos, setCurrentPos] = useState<Position | null>(null);
  const autoScrollRef = useRef<number | null>(null);
  
  // Limpieza del intervalo de auto-scroll cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (autoScrollRef.current !== null) {
        window.clearInterval(autoScrollRef.current);
        autoScrollRef.current = null;
      }
    };
  }, []);

  // Función para verificar si un elemento está dentro del rectángulo de selección
  const isElementInSelection = useCallback((selectionRect: SelectionRect, elementRect: DOMRect): boolean => {
    return !(
      selectionRect.left > elementRect.right ||
      selectionRect.right < elementRect.left ||
      selectionRect.top > elementRect.bottom ||
      selectionRect.bottom < elementRect.top
    );
  }, []);

  // Iniciar el arrastre
  const handleDragStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Solo permitir arrastre con botón izquierdo
    if (e.button !== 0) return;
    
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setCurrentPos({ x: e.clientX, y: e.clientY });
    
    // Prevenir comportamiento predeterminado de arrastre del navegador
    e.preventDefault();
  }, []);

  // Actualizar selección durante el arrastre
  const handleDragMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !startPos) return;
    
    // Actualizar posición actual
    setCurrentPos({ x: e.clientX, y: e.clientY });
    
    // Calcular rectángulo de selección
    const selectionRect = {
      left: Math.min(startPos.x, e.clientX),
      right: Math.max(startPos.x, e.clientX),
      top: Math.min(startPos.y, e.clientY),
      bottom: Math.max(startPos.y, e.clientY),
      width: Math.abs(e.clientX - startPos.x),
      height: Math.abs(e.clientY - startPos.y),
    };
    
    // Si el rectángulo es muy pequeño, considerarlo como un clic
    if (selectionRect.width < minSelectionSize && selectionRect.height < minSelectionSize) {
      return;
    }
    
    // Calcular distancias a los bordes de la ventana
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const distanceFromBottom = viewportHeight - e.clientY;
    const distanceFromTop = e.clientY;
    const distanceFromRight = viewportWidth - e.clientX;
    const distanceFromLeft = e.clientX;
    
    // Comprobar si debemos hacer auto-scroll
    const shouldScrollDown = distanceFromBottom < scrollThreshold;
    const shouldScrollUp = distanceFromTop < scrollThreshold;
    const shouldScrollRight = distanceFromRight < scrollThreshold;
    const shouldScrollLeft = distanceFromLeft < scrollThreshold;
    
    // Calcular velocidad dinámica de desplazamiento
    const verticalSpeed = shouldScrollDown ? 
                       baseScrollSpeed + Math.max(0, (scrollThreshold - distanceFromBottom) / 3) : 
                       shouldScrollUp ? 
                       baseScrollSpeed + Math.max(0, (scrollThreshold - distanceFromTop) / 3) : 
                       0;
                           
    const horizontalSpeed = shouldScrollRight ? 
                         baseScrollSpeed + Math.max(0, (scrollThreshold - distanceFromRight) / 3) : 
                         shouldScrollLeft ? 
                         baseScrollSpeed + Math.max(0, (scrollThreshold - distanceFromLeft) / 3) : 
                         0;
    
    // Limpiar intervalo existente
    if (autoScrollRef.current !== null) {
      window.clearInterval(autoScrollRef.current);
      autoScrollRef.current = null;
    }
    
    // Establecer nuevo intervalo si estamos cerca de los bordes
    if (shouldScrollDown || shouldScrollUp || shouldScrollRight || shouldScrollLeft) {
      autoScrollRef.current = window.setInterval(() => {
        // Desplazamiento vertical
        if (shouldScrollDown) {
          window.scrollBy(0, verticalSpeed);
        } else if (shouldScrollUp) {
          window.scrollBy(0, -verticalSpeed);
        }
        
        // Desplazamiento horizontal
        if (shouldScrollRight) {
          window.scrollBy(horizontalSpeed, 0);
        } else if (shouldScrollLeft) {
          window.scrollBy(-horizontalSpeed, 0);
        }
        
        // Actualizar posición actual para seguir el scroll
        if (currentPos) {
          const newY = shouldScrollDown ? currentPos.y + verticalSpeed : 
                      shouldScrollUp ? currentPos.y - verticalSpeed : 
                      currentPos.y;
                      
          const newX = shouldScrollRight ? currentPos.x + horizontalSpeed : 
                      shouldScrollLeft ? currentPos.x - horizontalSpeed : 
                      currentPos.x;
                      
          setCurrentPos({ x: newX, y: newY });
        }
      }, 50); // Intervalo de 50ms para un scrolling suave
    }
    
    // Seleccionar los elementos que están dentro del rectángulo
    const elements = document.querySelectorAll(elementSelector);
    const selectedIds: number[] = [];
    
    // Detectar si se está usando la tecla Alt para deseleccionar
    const isDeselecting = e.altKey;
    
    elements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const idAttr = element.getAttribute(idAttribute);
      
      if (!idAttr) return;
      
      const id = Number(idAttr);
      if (!id) return;
      
      if (isElementInSelection(selectionRect, rect)) {
        selectedIds.push(id);
      }
    });
    
    // Llamar al callback con los IDs seleccionados
    if (selectedIds.length > 0) {
      onSelectionChange(selectedIds, isDeselecting);
    }
    
    e.preventDefault();
  }, [isDragging, startPos, currentPos, elementSelector, idAttribute, scrollThreshold, baseScrollSpeed, minSelectionSize, isElementInSelection, onSelectionChange]);

  // Terminar el arrastre
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    
    // Limpiar intervalo de auto-scroll
    if (autoScrollRef.current !== null) {
      window.clearInterval(autoScrollRef.current);
      autoScrollRef.current = null;
    }
    
    setIsDragging(false);
    setStartPos(null);
    setCurrentPos(null);
  }, [isDragging]);

  // Calcular el estilo del rectángulo de selección
  const selectionRectStyle = useCallback(() => {
    if (!startPos || !currentPos) return {};
    
    const left = Math.min(startPos.x, currentPos.x);
    const top = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);
    
    return {
      position: 'fixed' as const,
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      borderRadius: '4px',
      zIndex: 50,
      pointerEvents: 'none',
    };
  }, [startPos, currentPos]);

  return {
    isDragging,
    selectionRectStyle: selectionRectStyle(),
    handleDragStart,
    handleDragMove,
    handleDragEnd
  };
}