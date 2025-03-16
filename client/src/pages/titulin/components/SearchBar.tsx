import { Input } from "@/components/ui/input";
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

  useEffect(() => {
    setInputValue(searchValue);
  }, [searchValue]);

  const handleSearch = () => {
    const trimmedValue = inputValue.trim();
    setSearchValue(trimmedValue);
    setTitleFilter(trimmedValue);
    setCurrentPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClear = () => {
    setInputValue("");
    setSearchValue("");
    setTitleFilter("");
    setCurrentPage(1);
  };

  return (
    <div className="w-full">
      <div className="relative flex items-center w-full bg-background rounded-md border shadow-sm focus-within:ring-1 focus-within:ring-primary">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar videos por título..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-10 h-11 text-base bg-transparent border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          disabled={isFetching}
        />
        {inputValue && (
          <button 
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground hover:text-foreground"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}