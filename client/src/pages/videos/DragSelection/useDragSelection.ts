import { useState, useRef, useCallback, useEffect } from 'react';

interface Position {
  x: number;
  y: number;
}

interface Selection {
  startPosition: Position | null;
  currentPosition: Position | null;
}

interface SelectionRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

interface DragSelectionOptions {
  selectMode: boolean;
  onSelectionChange: (selectedIds: number[], isAltKeyPressed: boolean) => void;
  scrollThreshold?: number;
  baseScrollSpeed?: number;
  scrollInterval?: number;
  minSelectionSize?: number;
  selectionElementSelector?: string;
  idDataAttribute?: string;
}

export function useDragSelection({
  selectMode,
  onSelectionChange,
  scrollThreshold = 60,
  baseScrollSpeed = 10,
  scrollInterval = 50,
  minSelectionSize = 4,
  selectionElementSelector = '.video-card',
  idDataAttribute = 'data-video-id'
}: DragSelectionOptions) {
  // Estado para el arrastre
  const [isDragging, setIsDragging] = useState(false);
  const [selection, setSelection] = useState<Selection>({
    startPosition: null,
    currentPosition: null,
  });

  // Referencia para el intervalo de auto-scroll
  const autoScrollIntervalRef = useRef<number | null>(null);

  // Limpiar el intervalo cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (autoScrollIntervalRef.current !== null) {
        window.clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
    };
  }, []);

  // Detener arrastre cuando se desactiva el modo selección
  useEffect(() => {
    if (!selectMode && isDragging) {
      setIsDragging(false);
      setSelection({
        startPosition: null,
        currentPosition: null,
      });

      if (autoScrollIntervalRef.current !== null) {
        window.clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
    }
  }, [selectMode, isDragging]);

  // Verificar si un elemento está dentro del rectángulo de selección
  const isElementInSelection = useCallback(
    (selectionRect: SelectionRect, elementRect: DOMRect) => {
      return !(
        selectionRect.left > elementRect.right ||
        selectionRect.right < elementRect.left ||
        selectionRect.top > elementRect.bottom ||
        selectionRect.bottom < elementRect.top
      );
    },
    []
  );

  // Iniciar el arrastre
  const handleDragStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!selectMode) return;
      
      // Solo permitir arrastre con botón izquierdo
      if (e.button !== 0) return;

      setIsDragging(true);
      setSelection({
        startPosition: { x: e.clientX, y: e.clientY },
        currentPosition: { x: e.clientX, y: e.clientY },
      });

      // Prevenir comportamiento predeterminado del navegador
      e.preventDefault();
    },
    [selectMode]
  );

  // Actualizar mientras se arrastra
  const handleDragMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging || !selectMode || !selection.startPosition) return;

      // Actualizar la posición actual
      setSelection(prev => ({
        ...prev,
        currentPosition: { x: e.clientX, y: e.clientY },
      }));

      // Calcular el rectángulo de selección
      const selectionRect = {
        left: Math.min(selection.startPosition.x, e.clientX),
        right: Math.max(selection.startPosition.x, e.clientX),
        top: Math.min(selection.startPosition.y, e.clientY),
        bottom: Math.max(selection.startPosition.y, e.clientY),
        width: Math.abs(e.clientX - selection.startPosition.x),
        height: Math.abs(e.clientY - selection.startPosition.y),
      };

      // Si el rectángulo es muy pequeño, considerarlo como un clic
      if (selectionRect.width < minSelectionSize && selectionRect.height < minSelectionSize) {
        return;
      }

      // Auto-scroll cuando el cursor está cerca de los bordes
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Calcular distancias a los bordes
      const distanceFromBottom = viewportHeight - e.clientY;
      const distanceFromTop = e.clientY;
      const distanceFromRight = viewportWidth - e.clientX;
      const distanceFromLeft = e.clientX;
      
      // Determinar si debemos hacer scroll y en qué dirección
      const shouldScrollDown = distanceFromBottom < scrollThreshold;
      const shouldScrollUp = distanceFromTop < scrollThreshold;
      const shouldScrollRight = distanceFromRight < scrollThreshold;
      const shouldScrollLeft = distanceFromLeft < scrollThreshold;
      
      // Calcular velocidades dinámicas basadas en la proximidad al borde
      const verticalSpeed = shouldScrollDown
        ? baseScrollSpeed + Math.max(0, (scrollThreshold - distanceFromBottom) / 3)
        : shouldScrollUp
        ? baseScrollSpeed + Math.max(0, (scrollThreshold - distanceFromTop) / 3)
        : 0;
        
      const horizontalSpeed = shouldScrollRight
        ? baseScrollSpeed + Math.max(0, (scrollThreshold - distanceFromRight) / 3)
        : shouldScrollLeft
        ? baseScrollSpeed + Math.max(0, (scrollThreshold - distanceFromLeft) / 3)
        : 0;
      
      // Limpiar intervalo existente
      if (autoScrollIntervalRef.current !== null) {
        window.clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
      
      // Establecer nuevo intervalo si estamos cerca de los bordes
      if (shouldScrollDown || shouldScrollUp || shouldScrollRight || shouldScrollLeft) {
        autoScrollIntervalRef.current = window.setInterval(() => {
          // Scroll vertical
          if (shouldScrollDown) {
            window.scrollBy(0, verticalSpeed);
          } else if (shouldScrollUp) {
            window.scrollBy(0, -verticalSpeed);
          }
          
          // Scroll horizontal
          if (shouldScrollRight) {
            window.scrollBy(horizontalSpeed, 0);
          } else if (shouldScrollLeft) {
            window.scrollBy(-horizontalSpeed, 0);
          }
          
          // Actualizar posición después del scroll
          if (selection.currentPosition) {
            const newY = shouldScrollDown
              ? selection.currentPosition.y + verticalSpeed
              : shouldScrollUp
              ? selection.currentPosition.y - verticalSpeed
              : selection.currentPosition.y;
              
            const newX = shouldScrollRight
              ? selection.currentPosition.x + horizontalSpeed
              : shouldScrollLeft
              ? selection.currentPosition.x - horizontalSpeed
              : selection.currentPosition.x;
              
            setSelection(prev => ({
              ...prev,
              currentPosition: { x: newX, y: newY },
            }));
          }
        }, scrollInterval);
      }

      // Obtener elementos seleccionados
      const elements = document.querySelectorAll(selectionElementSelector);
      const selectedIds: number[] = [];
      
      elements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const videoIdAttr = element.getAttribute(idDataAttribute);
        
        if (!videoIdAttr) return;
        
        const videoId = Number(videoIdAttr);
        
        if (!videoId) return;
        
        if (isElementInSelection(selectionRect, rect)) {
          selectedIds.push(videoId);
        }
      });
      
      // Actualizar selección sólo si hay elementos en el rectángulo
      if (selectedIds.length > 0) {
        // Detectar si se usa Alt para deseleccionar
        const isAltKeyPressed = e.altKey;
        onSelectionChange(selectedIds, isAltKeyPressed);
      }
      
      e.preventDefault();
    },
    [
      isDragging,
      selectMode,
      selection,
      scrollThreshold,
      baseScrollSpeed,
      scrollInterval,
      minSelectionSize,
      selectionElementSelector,
      idDataAttribute,
      isElementInSelection,
      onSelectionChange,
    ]
  );

  // Finalizar arrastre
  const handleDragEnd = useCallback(() => {
    if (!isDragging || !selectMode) return;
    
    // Limpiar intervalo de auto-scroll
    if (autoScrollIntervalRef.current !== null) {
      window.clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
    
    setIsDragging(false);
    setSelection({
      startPosition: null,
      currentPosition: null,
    });
  }, [isDragging, selectMode]);

  // Calcular estilo del rectángulo de selección
  const selectionRectStyle = useCallback(() => {
    if (!selection.startPosition || !selection.currentPosition) {
      return {};
    }
    
    // Calcular posiciones
    const left = Math.min(selection.startPosition.x, selection.currentPosition.x);
    const top = Math.min(selection.startPosition.y, selection.currentPosition.y);
    const width = Math.abs(selection.currentPosition.x - selection.startPosition.x);
    const height = Math.abs(selection.currentPosition.y - selection.startPosition.y);
    
    return {
      position: 'fixed' as const,
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  }, [selection]);

  return {
    isDragging,
    selectionRectStyle: selectionRectStyle(),
    handleDragStart,
    handleDragMove,
    handleDragEnd,
  };
}