import { useRef, useState, useCallback, useEffect } from "react";

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
  const [isDragging, setIsDragging] = useState(false);
  const [selection, setSelection] = useState<Selection>({
    startPosition: null,
    currentPosition: null
  });
  
  const autoScrollIntervalRef = useRef<number | null>(null);

  // Clean up auto-scroll interval when component unmounts
  useEffect(() => {
    return () => {
      if (autoScrollIntervalRef.current !== null) {
        window.clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
    };
  }, []);

  // Function to check if a rectangle contains an element
  const rectangleContainsElement = useCallback(
    (selectionRect: SelectionRect, elementRect: DOMRect) => {
      // An element is inside if there's an intersection
      return !(
        selectionRect.left > elementRect.right ||
        selectionRect.right < elementRect.left ||
        selectionRect.top > elementRect.bottom ||
        selectionRect.bottom < elementRect.top
      );
    },
    []
  );

  // Handler for starting the drag selection
  const handleDragStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!selectMode) return;
      
      // Only allow left-button drag
      if (e.button !== 0) return;
      
      setIsDragging(true);
      setSelection({
        startPosition: { x: e.clientX, y: e.clientY },
        currentPosition: { x: e.clientX, y: e.clientY }
      });
      
      // Prevent default browser drag behavior
      e.preventDefault();
    },
    [selectMode]
  );

  // Handler for the drag movement
  const handleDragMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging || !selectMode || !selection.startPosition) return;
      
      // Update current position
      setSelection(prev => ({
        ...prev,
        currentPosition: { x: e.clientX, y: e.clientY }
      }));
      
      // Calculate selection rectangle
      const selectionRect = {
        left: Math.min(selection.startPosition.x, e.clientX),
        right: Math.max(selection.startPosition.x, e.clientX),
        top: Math.min(selection.startPosition.y, e.clientY),
        bottom: Math.max(selection.startPosition.y, e.clientY),
        width: Math.abs(e.clientX - selection.startPosition.x),
        height: Math.abs(e.clientY - selection.startPosition.y),
      };
      
      // If the selection rectangle is too small, consider it a click
      if (selectionRect.width < minSelectionSize && selectionRect.height < minSelectionSize) {
        return;
      }
      
      // Calculate distances from the edges of the viewport
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const distanceFromBottom = viewportHeight - e.clientY;
      const distanceFromTop = e.clientY;
      const distanceFromRight = viewportWidth - e.clientX;
      const distanceFromLeft = e.clientX;
      
      // Check if we should auto-scroll
      const shouldScrollDown = distanceFromBottom < scrollThreshold;
      const shouldScrollUp = distanceFromTop < scrollThreshold;
      const shouldScrollRight = distanceFromRight < scrollThreshold;
      const shouldScrollLeft = distanceFromLeft < scrollThreshold;
      
      // Calculate dynamic scroll speeds based on proximity to the edge
      const verticalScrollSpeed = shouldScrollDown
        ? baseScrollSpeed + Math.max(0, (scrollThreshold - distanceFromBottom) / 3)
        : shouldScrollUp
        ? baseScrollSpeed + Math.max(0, (scrollThreshold - distanceFromTop) / 3)
        : 0;
        
      const horizontalScrollSpeed = shouldScrollRight
        ? baseScrollSpeed + Math.max(0, (scrollThreshold - distanceFromRight) / 3)
        : shouldScrollLeft
        ? baseScrollSpeed + Math.max(0, (scrollThreshold - distanceFromLeft) / 3)
        : 0;
      
      // Clear existing interval if there is one
      if (autoScrollIntervalRef.current !== null) {
        window.clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
      
      // Set new interval if we're near the edges
      if (shouldScrollDown || shouldScrollUp || shouldScrollRight || shouldScrollLeft) {
        const intervalId = window.setInterval(() => {
          // Vertical scrolling
          if (shouldScrollDown) {
            window.scrollBy(0, verticalScrollSpeed);
          } else if (shouldScrollUp) {
            window.scrollBy(0, -verticalScrollSpeed);
          }
          
          // Horizontal scrolling
          if (shouldScrollRight) {
            window.scrollBy(horizontalScrollSpeed, 0);
          } else if (shouldScrollLeft) {
            window.scrollBy(-horizontalScrollSpeed, 0);
          }
          
          // Update the current position based on the new scroll coordinates
          if (selection.currentPosition) {
            const newY = shouldScrollDown
              ? selection.currentPosition.y + verticalScrollSpeed
              : shouldScrollUp
              ? selection.currentPosition.y - verticalScrollSpeed
              : selection.currentPosition.y;
              
            const newX = shouldScrollRight
              ? selection.currentPosition.x + horizontalScrollSpeed
              : shouldScrollLeft
              ? selection.currentPosition.x - horizontalScrollSpeed
              : selection.currentPosition.x;
              
            setSelection(prev => ({
              ...prev,
              currentPosition: { x: newX, y: newY }
            }));
          }
        }, scrollInterval);
        
        // Save the interval ID to clear it later
        autoScrollIntervalRef.current = intervalId;
      }
      
      // Get all selectable elements in the current view
      const selectableElements = document.querySelectorAll(selectionElementSelector);
      
      // Store IDs of elements being selected now
      const currentlySelectedIds: number[] = [];
      const currentlyDeselectedIds: number[] = [];
      
      // Check if Alt key is pressed (for deselection)
      const isAltKeyPressed = e.altKey;
      
      selectableElements.forEach(element => {
        const elementRect = element.getBoundingClientRect();
        const elementIdAttr = element.getAttribute(idDataAttribute);
        
        if (!elementIdAttr) return;
        
        const elementId = Number(elementIdAttr);
        if (!elementId) return;
        
        // Check if the element is inside the selection rectangle
        const isContained = rectangleContainsElement(selectionRect, elementRect);
        
        if (isContained) {
          if (isAltKeyPressed) {
            // Alt pressed, deselecting
            currentlyDeselectedIds.push(elementId);
          } else {
            // No Alt, selecting normally
            currentlySelectedIds.push(elementId);
          }
        }
      });
      
      // Call the callback with the ids and Alt key state
      onSelectionChange(
        isAltKeyPressed ? currentlyDeselectedIds : currentlySelectedIds,
        isAltKeyPressed
      );
      
      e.preventDefault();
    },
    [
      isDragging,
      selectMode,
      selection.startPosition,
      selection.currentPosition,
      scrollThreshold,
      baseScrollSpeed,
      minSelectionSize,
      selectionElementSelector,
      idDataAttribute,
      rectangleContainsElement,
      onSelectionChange
    ]
  );

  // Handler for ending the drag selection
  const handleDragEnd = useCallback(() => {
    if (!isDragging || !selectMode) return;
    
    // Clear any auto-scroll interval
    if (autoScrollIntervalRef.current !== null) {
      window.clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
    
    setIsDragging(false);
    setSelection({
      startPosition: null,
      currentPosition: null
    });
  }, [isDragging, selectMode]);

  // Calculate the selection rectangle style for rendering
  const getSelectionRectStyle = useCallback(() => {
    if (!selection.startPosition || !selection.currentPosition) return {};
    
    // Calculate the position relative to the viewport
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
    selectionRectStyle: getSelectionRectStyle(),
    handleDragStart,
    handleDragMove,
    handleDragEnd
  };
}