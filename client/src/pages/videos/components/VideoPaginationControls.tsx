import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";

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

  return (
    <div className="mt-4 flex items-center justify-center mb-6">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (currentPage > 1) {
                  setCurrentPage(currentPage - 1);
                }
              }}
              aria-disabled={currentPage <= 1}
              className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          
          {/* Generar los elementos de paginación */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Mostrar siempre la primera página, la última y las que rodean a la actual
            let pageToShow = i + 1;
            
            if (totalPages > 5) {
              if (currentPage <= 3) {
                // Estamos cerca del inicio, mostrar las primeras páginas
                pageToShow = i + 1;
              } else if (currentPage >= totalPages - 2) {
                // Estamos cerca del final, mostrar las últimas páginas
                pageToShow = totalPages - 4 + i;
              } else {
                // Estamos en el medio, mostrar páginas alrededor de la actual
                pageToShow = currentPage - 2 + i;
              }
            }
            
            return (
              <PaginationItem key={pageToShow}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(pageToShow);
                  }}
                  isActive={currentPage === pageToShow}
                >
                  {pageToShow}
                </PaginationLink>
              </PaginationItem>
            );
          })}
          
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (currentPage < totalPages) {
                  setCurrentPage(currentPage + 1);
                }
              }}
              aria-disabled={currentPage >= totalPages}
              className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}