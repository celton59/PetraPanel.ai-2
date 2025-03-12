import React from 'react';
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
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface VideoPaginationControlsProps {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
}

export function VideoPaginationControls({
  currentPage,
  totalPages,
  setCurrentPage
}: VideoPaginationControlsProps) {
  if (totalPages <= 1) return null;

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
    <div className="flex justify-center mt-6 mb-10">
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
    </div>
  );
}

export default VideoPaginationControls;