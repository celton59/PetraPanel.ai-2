import React, { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Youtube, Link2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { AlertCircle, ExternalLink } from "lucide-react";

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
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authorizedChannels, setAuthorizedChannels] = useState<AuthorizedChannel[]>([]);
  const [selectedChannelTitle, setSelectedChannelTitle] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Estado para la URL manual de conexión
  const [manualUrl, setManualUrl] = useState("");

  // Función para iniciar el flujo de autorización de YouTube
  const authorizeYouTube = () => {
    // Esta función debería redirigir al usuario a la página de autorización de YouTube
    window.location.href = "/api/youtube/authorize";
  };

  // Función para conectar un canal de forma manual
  const connectManualChannel = async () => {
    if (!manualUrl) {
      setError("Por favor ingresa la URL del canal de YouTube");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/api/youtube/connect-channel", { url: manualUrl });
      if (response.data.success) {
        fetchAuthorizedChannels();
        setManualUrl("");
        setConnectDialogOpen(false);
      } else {
        setError(response.data.message || "No se pudo conectar el canal");
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Error al conectar el canal de YouTube");
    } finally {
      setLoading(false);
    }
  };

  const fetchAuthorizedChannels = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("/api/youtube/authorized-channels");
      if (response.data.success) {
        setAuthorizedChannels(response.data.data || []);
        
        // Si ya hay un valor seleccionado, buscamos el nombre correspondiente
        if (value) {
          const selected = response.data.data.find((channel: AuthorizedChannel) => channel.id === value);
          if (selected) {
            setSelectedChannelTitle(selected.title);
          }
        }
      } else {
        setError(response.data.message || "No se pudieron cargar los canales autorizados");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Error al cargar los canales autorizados";
      setError(errorMessage);
      console.error(errorMessage, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthorizedChannels();
  }, [value]);

  return (
    <div className="space-y-2">
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
            ) : value && selectedChannelTitle ? (
              selectedChannelTitle
            ) : (
              "Selecciona un canal autorizado"
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Buscar canal..." />
            <CommandEmpty>
              {error ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-red-500 mb-2">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={authorizeYouTube}
                    className="mr-2"
                  >
                    <Youtube className="mr-2 h-4 w-4" />
                    Autorizar YouTube
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setConnectDialogOpen(true)}
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    Conectar canal
                  </Button>
                </div>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">No se encontraron canales.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={authorizeYouTube}
                    className="mr-2"
                  >
                    <Youtube className="mr-2 h-4 w-4" />
                    Autorizar YouTube
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setConnectDialogOpen(true)}
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    Conectar canal
                  </Button>
                </div>
              )}
            </CommandEmpty>
            <CommandGroup>
              {/* Opción para quitar la selección */}
              <CommandItem
                key="none"
                onSelect={() => {
                  onChange(null);
                  setSelectedChannelTitle("");
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
              
              {authorizedChannels.map((channel) => (
                <CommandItem
                  key={channel.id}
                  onSelect={() => {
                    onChange(channel.id);
                    setSelectedChannelTitle(channel.title);
                    setOpen(false);
                  }}
                  className="text-sm"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === channel.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center">
                    {channel.thumbnailUrl && (
                      <img 
                        src={channel.thumbnailUrl} 
                        alt={channel.title} 
                        className="w-6 h-6 rounded-full mr-2 object-cover" 
                      />
                    )}
                    <span>{channel.title}</span>
                  </div>
                  {channel.subscriberCount && (
                    <span className="ml-2 text-xs text-gray-500">
                      {new Intl.NumberFormat().format(channel.subscriberCount)} suscriptores
                    </span>
                  )}
                </CommandItem>
              ))}
              
              {authorizedChannels.length > 0 && (
                <div className="border-t pt-2 px-2 pb-2">
                  <div className="flex justify-between">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={authorizeYouTube}
                      className="mr-2 text-xs"
                    >
                      <Youtube className="mr-1 h-3 w-3" />
                      Autorizar más
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setOpen(false);
                        setConnectDialogOpen(true);
                      }}
                      className="text-xs"
                    >
                      <Link2 className="mr-1 h-3 w-3" />
                      Conectar canal
                    </Button>
                  </div>
                </div>
              )}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Diálogo para conectar canal */}
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Conectar canal de YouTube</DialogTitle>
            <DialogDescription>
              Ingresa la URL de tu canal de YouTube para conectarlo a tu cuenta
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Input 
                id="channel-url" 
                placeholder="https://www.youtube.com/c/MiCanal" 
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Ejemplo: https://www.youtube.com/c/MiCanal o https://youtube.com/@username
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button"
              variant="secondary" 
              onClick={() => setConnectDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={connectManualChannel}
              disabled={loading || !manualUrl}
            >
              {loading ? "Conectando..." : "Conectar canal"}
            </Button>
          </DialogFooter>
          
          <div className="mt-4 text-sm">
            <p className="font-medium">También puedes:</p>
            <Button 
              variant="link" 
              size="sm" 
              className="p-0 h-auto mt-1 text-sm font-normal"
              onClick={authorizeYouTube}
            >
              <Youtube className="mr-1 h-3 w-3" />
              Autorizar YouTube directamente
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}