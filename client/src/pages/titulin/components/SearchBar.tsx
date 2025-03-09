import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { AutocompleteSearch } from "./AutocompleteSearch";

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
  // Manejar la selección de sugerencia o búsqueda manual
  const handleSearch = (query: string) => {
    setSearchValue(query);
    setTitleFilter(query);
    setCurrentPage(1);
    // Al usar la búsqueda, desactivamos la selección por vocal
    if (selectedVowel) {
      setSelectedVowel(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative w-full">
        <AutocompleteSearch
          onSearch={handleSearch}
          placeholder="Buscar entre los videos..."
          minSearchLength={2}
          disabled={isSearching || isFetching}
        />
        
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
  );
}