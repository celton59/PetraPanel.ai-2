import React, { useEffect, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
import axios from "axios";

interface YouTubeChannelSelectorProps {
  value?: string | null;
  onChange: (value: string | null) => void;
}

interface YouTubeChannel {
  id: number;
  channelId: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  description?: string;
  subscriberCount?: number;
  videoCount?: number;
}

export function YouTubeChannelSelector({ value, onChange }: YouTubeChannelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [selectedName, setSelectedName] = useState<string>("");

  useEffect(() => {
    const fetchChannels = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/youtube-channels");
        if (response.data.success) {
          setChannels(response.data.data);
          
          // Si ya hay un valor seleccionado, buscamos el nombre correspondiente
          if (value) {
            const selected = response.data.data.find((channel: YouTubeChannel) => channel.channelId === value);
            if (selected) {
              setSelectedName(selected.name);
            }
          }
        }
      } catch (error) {
        console.error("Error al cargar canales de YouTube:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={loading}
        >
          {loading ? (
            "Cargando canales..."
          ) : value && selectedName ? (
            selectedName
          ) : (
            "Selecciona un canal de YouTube"
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar canal..." />
          <CommandEmpty>No se encontraron canales.</CommandEmpty>
          <CommandGroup>
            {/* Opción para quitar la selección */}
            <CommandItem
              key="none"
              onSelect={() => {
                onChange(null);
                setSelectedName("");
                setOpen(false);
              }}
              className="text-sm"
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  !value ? "opacity-100" : "opacity-0"
                )}
              />
              <span>Ninguno</span>
            </CommandItem>
            
            {channels.map((channel) => (
              <CommandItem
                key={channel.channelId}
                onSelect={() => {
                  onChange(channel.channelId);
                  setSelectedName(channel.name);
                  setOpen(false);
                }}
                className="text-sm"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === channel.channelId ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex items-center">
                  {channel.thumbnailUrl && (
                    <img 
                      src={channel.thumbnailUrl} 
                      alt={channel.name} 
                      className="w-6 h-6 rounded-full mr-2 object-cover" 
                    />
                  )}
                  <span>{channel.name}</span>
                </div>
                {channel.subscriberCount && (
                  <span className="ml-2 text-xs text-gray-500">
                    {new Intl.NumberFormat().format(channel.subscriberCount)} suscriptores
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}