import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, X } from "lucide-react";

interface SearchBarProps {
  searchValue: string;
  setSearchValue: (value: string) => void;
  setTitleFilter: (title: string) => void;
  setCurrentPage: (page: number) => void;
  setSelectedVowel: (vowel: string | null) => void;
  titleFilter: string;
  selectedVowel: string | null;
  isSearching: boolean;
  isFetching: boolean;
  handleClearVowelFilter: () => void;
}

export function SearchBar({
  searchValue,
  setSearchValue,
  setTitleFilter,
  setCurrentPage,
  setSelectedVowel,
  titleFilter,
  selectedVowel,
  isSearching,
  isFetching,
  handleClearVowelFilter
}: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <div className="space-y-3">
        <div className="relative">
          <Input
            placeholder="Buscar por título en los 6492 videos..."
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              // Al empezar a escribir, desactivamos la selección de vocal
              if (selectedVowel && e.target.value) {
                setSelectedVowel(null);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const currentValue = searchValue.trim();
                if (currentValue !== titleFilter && (currentValue.length >= 3 || currentValue === '')) {
                  // Búsqueda inmediata con Enter
                  setTitleFilter(currentValue);
                  setCurrentPage(1);
                  setSelectedVowel(null); // Desactivar filtro por vocal
                }
              }
            }}
            aria-label="Buscar videos"
            className={`pl-8 transition-all ${isSearching ? 'pr-10 bg-muted/30' : ''}`}
            disabled={isSearching || isFetching}
          />
          {(isSearching || isFetching) && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          
          {/* Indicador de filtro activo por vocal */}
          {selectedVowel && !isSearching && !isFetching && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                <span className="mr-1">Vocal: {selectedVowel.toUpperCase()}</span>
                <button 
                  onClick={handleClearVowelFilter}
                  className="h-4 w-4 rounded-full flex items-center justify-center hover:bg-primary/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}