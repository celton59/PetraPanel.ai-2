import React, { useEffect, useState } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight,
  ChevronsUpDown,
  Hash
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface VideoPaginationControlsProps {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage?: number;
  setItemsPerPage?: (limit: number) => void;
}

export function VideoPaginationControls({
  currentPage,
  totalPages,
  setCurrentPage,
  itemsPerPage = 10,
  setItemsPerPage
}: VideoPaginationControlsProps) {
  // Estado para el diálogo de selección de página
  const [isPageDialogOpen, setIsPageDialogOpen] = useState(false);
  const [pageInput, setPageInput] = useState("");

  // Asegurar que la página actual nunca sea mayor que el total de páginas
  // Esto previene errores cuando cambiamos el límite y no hay suficientes elementos
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages, setCurrentPage]);

  // Solo muestra la paginación si hay más de una página o si se puede cambiar el número de elementos por página
  const showPagination = totalPages > 1 || setItemsPerPage;

  // No mostrar la paginación en estos casos:
  // 1. Si no hay páginas o solo hay una y no se puede cambiar el límite
  // 2. Si el total de páginas es 0 (no hay videos)
  if (!showPagination || totalPages <= 0) return null;

  // Función para manejar el cambio de página manual
  const handlePageChange = () => {
    try {
      // Validar que sea un número dentro del rango válido
      const pageNumber = parseInt(pageInput);
      if (isNaN(pageNumber)) {
        toast.error(`Por favor, introduce un número válido`);
        return;
      }
      
      // Limitar al rango de páginas disponibles
      const validPageNumber = Math.max(1, Math.min(pageNumber, totalPages));
      
      if (validPageNumber !== pageNumber) {
        toast.warning(`Ajustado a página ${validPageNumber} (rango válido: 1-${totalPages})`);
      }
      
      // Cerrar el diálogo antes de cambiar de página para evitar problemas de UI
      setIsPageDialogOpen(false);
      
      // Limpiar el input
      setPageInput("");
      
      // Usar setTimeout para asegurar que el diálogo se cerró completamente
      setTimeout(() => {
        setCurrentPage(validPageNumber);
      }, 10);
    } catch (error) {
      console.error("Error al cambiar de página:", error);
      toast.error("Error al cambiar de página. Inténtalo de nuevo.");
      
      // Cerrar el diálogo y limpiar el estado en caso de error
      setIsPageDialogOpen(false);
      setPageInput("");
    }
  };

  // Función para generar los items de la paginación
  const generatePaginationItems = () => {
    // Protección contra valores inválidos
    const safeTotalPages = Math.max(1, totalPages || 1);
    const safeCurrentPage = Math.max(1, Math.min(currentPage || 1, safeTotalPages));
    
    // Caso simple: 7 o menos páginas
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1).map((page) => (
        <PaginationItem key={page}>
          <PaginationLink
            onClick={(e) => {
              e.preventDefault();
              try {
                setCurrentPage(page);
              } catch (error) {
                console.error(`Error al cambiar a la página ${page}:`, error);
                toast.error("Error al cambiar de página");
              }
            }}
            isActive={page === safeCurrentPage}
          >
            {page}
          </PaginationLink>
        </PaginationItem>
      ));
    }

    // Caso complejo: más de 7 páginas, necesitamos elipsis
    const items = [];

    // Siempre mostrar primera página
    items.push(
      <PaginationItem key={1}>
        <PaginationLink
          onClick={(e) => {
            e.preventDefault();
            try {
              setCurrentPage(1);
            } catch (error) {
              console.error("Error al cambiar a la primera página:", error);
              toast.error("Error al cambiar de página");
            }
          }}
          isActive={1 === safeCurrentPage}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    // Lógica para mostrar páginas alrededor de la actual
    if (safeCurrentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Páginas alrededor de la actual
    const startPage = Math.max(2, safeCurrentPage - 1);
    const endPage = Math.min(safeTotalPages - 1, safeCurrentPage + 1);

    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <PaginationItem key={page}>
          <PaginationLink
            onClick={(e) => {
              e.preventDefault();
              try {
                setCurrentPage(page);
              } catch (error) {
                console.error(`Error al cambiar a la página ${page}:`, error);
                toast.error("Error al cambiar de página");
              }
            }}
            isActive={page === safeCurrentPage}
          >
            {page}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Elipsis final si es necesario
    if (safeCurrentPage < safeTotalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Siempre mostrar última página
    if (safeTotalPages > 1) {
      items.push(
        <PaginationItem key={safeTotalPages}>
          <PaginationLink
            onClick={(e) => {
              e.preventDefault();
              try {
                setCurrentPage(safeTotalPages);
              } catch (error) {
                console.error(`Error al cambiar a la última página:`, error);
                toast.error("Error al cambiar de página");
              }
            }}
            isActive={safeTotalPages === safeCurrentPage}
          >
            {safeTotalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="flex flex-col items-center mt-6 mb-10 space-y-4">
      {/* Controles de paginación */}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={(e) => {
                e.preventDefault();
                if (currentPage > 1) {
                  try {
                    setCurrentPage(Math.max(1, currentPage - 1));
                  } catch (error) {
                    console.error("Error al cambiar a la página anterior:", error);
                    toast.error("Error al cambiar de página");
                  }
                }
              }}
              className={currentPage <= 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              tabIndex={currentPage <= 1 ? -1 : 0}
              aria-disabled={currentPage <= 1}
            />
          </PaginationItem>

          {generatePaginationItems()}

          {/* Botón para ir a una página específica */}
          <Dialog 
            open={isPageDialogOpen} 
            onOpenChange={(open) => {
              // Cuando el diálogo se cierra, limpiamos el input
              if (!open) {
                setPageInput("");
              }
              setIsPageDialogOpen(open);
            }}
          >
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9 p-0"
              >
                <Hash className="h-4 w-4" />
                <span className="sr-only">Ir a página</span>
              </Button>
            </DialogTrigger>
            <DialogContent 
              className="sm:max-w-[425px]" 
              onClick={(e) => e.stopPropagation()}
              onPointerDownOutside={(e) => {
                // Prevenir que clicks fuera del diálogo lo cierren y produzcan efectos secundarios
                e.preventDefault();
              }}
            >
              <DialogHeader>
                <DialogTitle>Ir a página</DialogTitle>
                <DialogDescription>
                  Introduce el número de página al que quieres ir (1-{totalPages})
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={pageInput}
                  onChange={(e) => {
                    // Validar que sea un número y esté dentro del rango
                    const value = e.target.value;
                    const parsed = parseInt(value);
                    if (value === "" || (
                      !isNaN(parsed) && parsed >= 1 && parsed <= totalPages
                    )) {
                      setPageInput(value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handlePageChange();
                    } else if (e.key === 'Escape') {
                      setIsPageDialogOpen(false);
                      setPageInput("");
                    }
                  }}
                  placeholder={`1-${totalPages}`}
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsPageDialogOpen(false);
                    setPageInput("");
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handlePageChange}>Ir a página</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <PaginationItem>
            <PaginationNext
              onClick={(e) => {
                e.preventDefault();
                if (currentPage < totalPages) {
                  try {
                    setCurrentPage(Math.min(totalPages, currentPage + 1));
                  } catch (error) {
                    console.error("Error al cambiar a la página siguiente:", error);
                    toast.error("Error al cambiar de página");
                  }
                }
              }}
              className={currentPage >= totalPages ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              tabIndex={currentPage >= totalPages ? -1 : 0}
              aria-disabled={currentPage >= totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* Selector de items por página */}
      {setItemsPerPage && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Mostrar</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(parseInt(value));
                    setCurrentPage(1); // Resetear a primera página al cambiar items por página
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={itemsPerPage} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                  </SelectContent>
                </Select>
              </TooltipTrigger>
              <TooltipContent>
                <p>Videos por página</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span>videos por página</span>
        </div>
      )}
    </div>
  );
}

export default VideoPaginationControls;