import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface VowelFilterProps {
  vowels: string[];
  selectedVowel: string | null;
  setSelectedVowel: (vowel: string | null) => void;
  setTitleFilter: (title: string) => void;
  setSearchValue: (value: string) => void;
  setCurrentPage: (page: number) => void;
  handleClearVowelFilter: () => void;
  isSearching: boolean;
  isFetching: boolean;
  vowelStats: Record<string, number> | undefined;
  totalVideos: number;
}

export function VowelFilter({
  vowels,
  selectedVowel,
  setSelectedVowel,
  setTitleFilter,
  setSearchValue,
  setCurrentPage,
  handleClearVowelFilter,
  isSearching,
  isFetching,
  vowelStats,
  totalVideos
}: VowelFilterProps) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="text-sm text-muted-foreground">Filtrar por primera vocal:</span>
      
      <div className="flex gap-1">
        {vowels.map((vowel) => {
          // Calcular estadísticas para este botón de vocal
          const count = vowelStats?.[vowel] || 0;
          const total = totalVideos || 0;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          
          return (
            <div key={vowel} className="flex flex-col items-center gap-1">
              <Button
                variant={selectedVowel === vowel ? "default" : "outline"}
                size="sm"
                className={`h-8 w-8 p-0 ${selectedVowel === vowel ? 'bg-primary text-primary-foreground' : ''}`}
                onClick={() => {
                  if (selectedVowel === vowel) {
                    // Si ya está seleccionada, deseleccionamos
                    setSelectedVowel(null);
                    setTitleFilter(""); // Limpiar filtro de título también
                  } else {
                    // Seleccionar esta vocal
                    setSelectedVowel(vowel);
                    setSearchValue(""); // Limpiar campo de búsqueda
                  }
                  setCurrentPage(1); // Resetear página
                }}
                disabled={isSearching || isFetching}
              >
                {vowel.toUpperCase()}
              </Button>
              
              {/* Indicador visual de distribución */}
              {vowelStats && (
                <div className="text-xs text-muted-foreground w-8 text-center" title={`${count} videos comienzan con la vocal ${vowel.toUpperCase()}`}>
                  <div 
                    className="h-1 bg-muted rounded-full overflow-hidden w-full"
                    role="progressbar"
                    aria-valuenow={percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${percentage}%` }} 
                    />
                  </div>
                  <span>{count}</span>
                </div>
              )}
            </div>
          );
        })}
        
        {selectedVowel && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground"
            onClick={handleClearVowelFilter}
            disabled={isSearching || isFetching}
          >
            <X className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>
    </div>
  );
}