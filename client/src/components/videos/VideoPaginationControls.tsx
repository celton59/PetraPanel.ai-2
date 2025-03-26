import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface VideoPaginationControlsProps {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (limit: number) => void;
}

export function VideoPaginationControls({
  currentPage,
  totalPages,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage
}: VideoPaginationControlsProps) {
  // Función para crear array de números para la paginación
  const getPageNumbers = () => {
    const pageNumbers = [];
    
    // Si hay menos de 7 páginas, mostrar todas
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
      return pageNumbers;
    }
    
    // Si la página actual está cerca del inicio
    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    
    // Si la página actual está cerca del final
    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    
    // Si la página actual está en medio
    return [
      1,
      '...',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      '...',
      totalPages
    ];
  };

  // Estado para el campo de salto a página
  const [pageInput, setPageInput] = React.useState<string>("");
  
  // Validación y navegación a página específica
  const handleJumpToPage = () => {
    const pageNumber = parseInt(pageInput);
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      setPageInput("");
    } else {
      // Si el número no es válido, mostrar un mensaje de error o simplemente limpiar el campo
      setPageInput("");
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
      <div className="flex items-center space-x-2">
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(value) => {
            setItemsPerPage(parseInt(value));
            setCurrentPage(1); // Volver a la primera página al cambiar el límite
          }}
        >
          <SelectTrigger className="w-[110px]">
            <SelectValue placeholder="Mostrar" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Elementos por página</SelectLabel>
              <SelectItem value="10">10 elementos</SelectItem>
              <SelectItem value="20">20 elementos</SelectItem>
              <SelectItem value="50">50 elementos</SelectItem>
              <SelectItem value="100">100 elementos</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        
        <span className="text-sm text-muted-foreground">
          Página {currentPage} de {totalPages}
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1 mr-4">
          <Input
            type="number"
            placeholder="Ir a"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            className="w-20 h-8 text-sm"
            min={1}
            max={totalPages}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleJumpToPage();
              }
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleJumpToPage}
            className="h-8"
          >
            Ir
          </Button>
        </div>
        
        <div className="flex items-center">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
            <span className="sr-only">Primera página</span>
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 ml-1"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Página anterior</span>
          </Button>
          
          <div className="flex items-center space-x-1 mx-1">
            {getPageNumbers().map((page, index) => (
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="px-2">...</span>
              ) : (
                <Button
                  key={`page-${page}`}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8"
                  onClick={() => typeof page === 'number' && setCurrentPage(page)}
                >
                  {page}
                </Button>
              )
            ))}
          </div>
          
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 mr-1"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Página siguiente</span>
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
            <span className="sr-only">Última página</span>
          </Button>
        </div>
      </div>
    </div>
  );
}