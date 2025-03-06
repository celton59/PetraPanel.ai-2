import React from "react"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ButtonProps, Button } from "@/components/ui/button"

export interface PaginationProps {
  className?: string
  pageCount: number
  currentPage: number
  onPageChange: (page: number) => void
  siblingCount?: number
}

export interface PaginationButtonProps extends ButtonProps {
  page: number
  isActive?: boolean
  disabled?: boolean
}

export interface PaginationMetadata {
  page: number
  limit: number
  totalVideos: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

const PaginationButton = React.forwardRef<
  HTMLButtonElement,
  PaginationButtonProps
>(({ className, page, isActive, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "h-9 w-9",
        isActive
          ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
          : "bg-transparent hover:bg-muted",
        className
      )}
      variant="outline"
      size="sm"
      {...props}
    >
      {page}
    </Button>
  )
})
PaginationButton.displayName = "PaginationButton"

function generatePaginationItems({
  currentPage,
  pageCount,
  siblingCount = 1,
}: {
  currentPage: number
  pageCount: number
  siblingCount?: number
}) {
  // Asegurarse de que currentPage está dentro de los límites
  const page = Math.min(Math.max(1, currentPage), pageCount)

  // Calcular el rango de páginas a mostrar
  const leftSiblingIndex = Math.max(page - siblingCount, 1)
  const rightSiblingIndex = Math.min(page + siblingCount, pageCount)

  // Añadir ellipsis si es necesario
  const shouldShowLeftDots = leftSiblingIndex > 2
  const shouldShowRightDots = rightSiblingIndex < pageCount - 1

  // Primera y última página siempre visibles
  const firstPageIndex = 1
  const lastPageIndex = pageCount

  // Caso 1: No hay puntos suspensivos a mostrar
  if (!shouldShowLeftDots && !shouldShowRightDots) {
    const range = Array.from(
      { length: pageCount },
      (_, i) => i + 1
    )
    return range
  }

  // Caso 2: Solo puntos suspensivos a la derecha
  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = 3 + 2 * siblingCount
    const leftRange = Array.from(
      { length: leftItemCount },
      (_, i) => i + 1
    )
    return [...leftRange, "...", lastPageIndex]
  }

  // Caso 3: Solo puntos suspensivos a la izquierda
  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = 3 + 2 * siblingCount
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => pageCount - rightItemCount + i + 1
    )
    return [firstPageIndex, "...", ...rightRange]
  }

  // Caso 4: Puntos suspensivos a ambos lados
  const middleRange = Array.from(
    { length: rightSiblingIndex - leftSiblingIndex + 1 },
    (_, i) => leftSiblingIndex + i
  )
  return [firstPageIndex, "...", ...middleRange, "...", lastPageIndex]
}

export function Pagination({
  className,
  pageCount,
  currentPage,
  onPageChange,
  siblingCount = 1,
}: PaginationProps) {
  const paginationItems = generatePaginationItems({
    currentPage,
    pageCount,
    siblingCount,
  })

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
    >
      <div className="flex items-center gap-1">
        <Button
          className="h-9 w-9 p-0"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
        >
          <ChevronsLeft className="h-4 w-4" />
          <span className="sr-only">Primera página</span>
        </Button>
        <Button
          className="h-9 w-9 p-0"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Página anterior</span>
        </Button>
        {paginationItems.map((item, i) =>
          item === "..." ? (
            <div
              key={`ellipsis-${i}`}
              className="flex h-9 w-9 items-center justify-center text-sm"
            >
              &#8230;
            </div>
          ) : (
            <PaginationButton
              key={`page-${item}`}
              page={item as number}
              isActive={currentPage === item}
              onClick={() => onPageChange(item as number)}
            />
          )
        )}
        <Button
          className="h-9 w-9 p-0"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= pageCount}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Siguiente página</span>
        </Button>
        <Button
          className="h-9 w-9 p-0"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pageCount)}
          disabled={currentPage >= pageCount}
        >
          <ChevronsRight className="h-4 w-4" />
          <span className="sr-only">Última página</span>
        </Button>
      </div>
    </nav>
  )
}