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

  // Solo muestra la paginación si hay más de una página o si se puede cambiar el número de elementos por página
  const showPagination = totalPages > 1 || setItemsPerPage;

  // No mostrar la paginación en estos casos:
  // 1. Si no hay páginas o solo hay una y no se puede cambiar el límite
  // 2. Si el total de páginas es 0 (no hay videos)
  if (!showPagination || totalPages <= 0) return null;

  // Asegurar que la página actual nunca sea mayor que el total de páginas
  // Esto previene errores cuando cambiamos el límite y no hay suficientes elementos
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages, setCurrentPage]);

  // Función para manejar el cambio de página manual
  const handlePageChange = () => {
    const pageNumber = parseInt(pageInput);
    if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > totalPages) {
      toast.error(`Por favor, introduce un número entre 1 y ${totalPages}`);
      return;
    }
    setCurrentPage(pageNumber);
    setIsPageDialogOpen(false);
    setPageInput("");
  };

  // Función para generar los items de la paginación
  const generatePaginationItems = () => {
    // Caso simple: 7 o menos páginas
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <PaginationItem key={page}>
          <PaginationLink
            onClick={() => setCurrentPage(page)}
            isActive={page === currentPage}
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
          onClick={() => setCurrentPage(1)}
          isActive={1 === currentPage}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    // Lógica para mostrar páginas alrededor de la actual
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Páginas alrededor de la actual
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <PaginationItem key={page}>
          <PaginationLink
            onClick={() => setCurrentPage(page)}
            isActive={page === currentPage}
          >
            {page}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Elipsis final si es necesario
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Siempre mostrar última página
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => setCurrentPage(totalPages)}
            isActive={totalPages === currentPage}
          >
            {totalPages}
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
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              className={currentPage <= 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              tabIndex={currentPage <= 1 ? -1 : 0}
              aria-disabled={currentPage <= 1}
            />
          </PaginationItem>

          {generatePaginationItems()}

          {/* Botón para ir a una página específica */}
          <Dialog open={isPageDialogOpen} onOpenChange={setIsPageDialogOpen}>
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
            <DialogContent>
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
                  onChange={(e) => setPageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handlePageChange();
                    }
                  }}
                  placeholder={`1-${totalPages}`}
                />
              </div>
              <DialogFooter>
                <Button onClick={handlePageChange}>Ir a página</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <PaginationItem>
            <PaginationNext
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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