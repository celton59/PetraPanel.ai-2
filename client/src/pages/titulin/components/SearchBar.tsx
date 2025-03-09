import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";

interface SearchBarProps {
  searchValue: string;
  setSearchValue: (value: string) => void;
  setTitleFilter: (title: string) => void;
  setCurrentPage: (page: number) => void;
  isFetching: boolean;
}

export function SearchBar({
  searchValue,
  setSearchValue,
  setTitleFilter,
  setCurrentPage,
  isFetching
}: SearchBarProps) {
  const [inputValue, setInputValue] = useState(searchValue);

  // Actualizar el valor de entrada cuando cambia el valor externo
  useEffect(() => {
    setInputValue(searchValue);
  }, [searchValue]);

  // Manejar la búsqueda
  const handleSearch = () => {
    const trimmedValue = inputValue.trim();
    setSearchValue(trimmedValue);
    setTitleFilter(trimmedValue);
    setCurrentPage(1);
  };

  // Manejar el evento Enter en el input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Limpiar la búsqueda
  const handleClear = () => {
    setInputValue("");
    setSearchValue("");
    setTitleFilter("");
    setCurrentPage(1);
  };

  return (
    <div className="flex w-full gap-2">
      <div className="relative flex-grow">
        <Input
          placeholder="Buscar videos..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10"
          disabled={isFetching}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        
        {inputValue && (
          <button 
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      <Button 
        onClick={handleSearch} 
        disabled={isFetching}
        variant="default"
        className="whitespace-nowrap"
      >
        <Search className="mr-2 h-4 w-4" />
        Buscar
      </Button>
    </div>
  );
}