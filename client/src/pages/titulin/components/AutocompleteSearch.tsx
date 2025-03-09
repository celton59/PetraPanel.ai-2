import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Loader2, Search } from "lucide-react";

// Implementación directa del hook useDebounce para evitar problemas de importación
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface AutocompleteSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  minSearchLength?: number;
  disabled?: boolean;
}

interface Suggestion {
  title: string;
  count: number;
}

export function AutocompleteSearch({
  onSearch,
  placeholder = "Buscar videos...",
  minSearchLength = 2,
  disabled = false
}: AutocompleteSearchProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const commandRef = useRef<HTMLDivElement>(null);
  const debouncedInputValue = useDebounce(inputValue, 300);

  // Obtener sugerencias cuando el valor del input cambia
  useEffect(() => {
    async function fetchSuggestions() {
      if (debouncedInputValue.length < minSearchLength) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await axios.get("/api/titulin/suggestions", {
          params: { query: debouncedInputValue }
        });
        setSuggestions(response.data.suggestions || []);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSuggestions();
  }, [debouncedInputValue, minSearchLength]);

  // Cerrar el dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (commandRef.current && !commandRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Mostrar el dropdown cuando se enfoca en el input
  const handleFocus = () => {
    if (inputValue.length >= minSearchLength) {
      setOpen(true);
    }
  };

  // Manejar la selección de una sugerencia
  const handleSelect = (value: string) => {
    setInputValue(value);
    onSearch(value);
    setOpen(false);
  };

  // Manejar el cambio en el input
  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (value.length >= minSearchLength) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  // Manejar la pulsación de Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch(inputValue);
      setOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={commandRef}>
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Command shouldFilter={false} className={open ? "rounded-md border shadow-md" : ""}>
          <CommandInput
            placeholder={placeholder}
            value={inputValue}
            onValueChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            className="pl-8"
            disabled={disabled}
          />
          {open && (
            <CommandList>
              {isLoading ? (
                <div className="py-6 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground mt-2">Buscando sugerencias...</p>
                </div>
              ) : (
                <>
                  <CommandEmpty>No se encontraron resultados</CommandEmpty>
                  <CommandGroup>
                    {suggestions.map((suggestion) => (
                      <CommandItem
                        key={suggestion.title}
                        value={suggestion.title}
                        onSelect={handleSelect}
                        className="flex justify-between"
                      >
                        <span>{suggestion.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {suggestion.count} {suggestion.count === 1 ? "video" : "videos"}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          )}
        </Command>
        {isLoading && !open && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}