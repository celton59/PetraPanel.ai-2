import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Check, ChevronDown, ChevronsUpDown, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

interface AuthorizedYouTubeChannelSelectorProps {
  value?: string | null;
  onChange: (value: string | null) => void;
}

interface AuthorizedChannel {
  id: string;
  title: string;
  customUrl?: string;
  thumbnailUrl?: string;
  subscriberCount?: number;
  videoCount?: number;
  isConnected?: boolean;
}

export function AuthorizedYouTubeChannelSelector({ 
  value, 
  onChange 
}: AuthorizedYouTubeChannelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["authorized-youtube-channels"],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/youtube/authorized-channels");
        if (!response.data.success) {
          throw new Error(response.data.message || "Error al obtener canales");
        }
        return response.data.data as AuthorizedChannel[];
      } catch (error) {
        console.error("Error fetching authorized channels:", error);
        throw error;
      }
    }
  });

  // Filtrar canales según la búsqueda
  const filteredChannels = data?.filter(channel => 
    channel.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value && data ? (
            <div className="flex items-center">
              {(() => {
                const selected = data.find(channel => channel.id === value);
                if (selected?.thumbnailUrl) {
                  return (
                    <img 
                      src={selected.thumbnailUrl} 
                      alt={selected.title} 
                      className="w-5 h-5 rounded-full mr-2 object-cover"
                    />
                  );
                }
                return <Youtube className="mr-2 h-4 w-4" />;
              })()}
              <span>{data.find(channel => channel.id === value)?.title || "Seleccionar canal"}</span>
            </div>
          ) : (
            "Seleccionar canal de YouTube"
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput 
            placeholder="Buscar canal..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          {isLoading ? (
            <div className="p-2 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : isError ? (
            <CommandEmpty>Error al cargar canales. Intenta nuevamente.</CommandEmpty>
          ) : (
            <>
              {!filteredChannels?.length ? (
                <CommandEmpty>No se encontraron canales. <Button variant="link" onClick={() => window.location.href = '/configuracion/youtube'}>Conectar canal</Button></CommandEmpty>
              ) : (
                <CommandGroup>
                  {filteredChannels.map((channel) => (
                    <CommandItem
                      key={channel.id}
                      value={channel.id}
                      onSelect={() => {
                        onChange(channel.id);
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        {channel.thumbnailUrl ? (
                          <img 
                            src={channel.thumbnailUrl} 
                            alt={channel.title} 
                            className="w-5 h-5 rounded-full mr-2 object-cover"
                          />
                        ) : (
                          <Youtube className="mr-2 h-4 w-4" />
                        )}
                        <span>{channel.title}</span>
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          value === channel.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              <div className="p-2 border-t">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-sm"
                  onClick={() => window.location.href = '/configuracion/youtube'}
                >
                  <Youtube className="mr-2 h-4 w-4" />
                  Gestionar canales
                </Button>
              </div>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}