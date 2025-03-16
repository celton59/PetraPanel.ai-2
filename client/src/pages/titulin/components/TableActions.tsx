import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Loader2, RotateCw, Filter } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { TitulinChannel } from "@/hooks/useTitulin";

interface TableActionsProps {
  channelFilter: string;
  setChannelFilter: (value: string) => void;
  setCurrentPage: (page: number) => void;
  channels: TitulinChannel[] | undefined;
  handleDownloadCSV: () => void;
  isDownloading: boolean;
  onlyEvergreen?: boolean;
  setOnlyEvergreen?: (value: boolean) => void;
  onlyAnalyzed?: boolean;
  setOnlyAnalyzed?: (value: boolean) => void;
  refreshData?: () => void;
  isRefreshing?: boolean;
}

export function TableActions({
  channelFilter,
  setChannelFilter,
  setCurrentPage,
  channels,
  handleDownloadCSV,
  isDownloading,
  onlyEvergreen = false,
  setOnlyEvergreen,
  onlyAnalyzed = false,
  setOnlyAnalyzed,
  refreshData,
  isRefreshing = false
}: TableActionsProps) {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Actualizar los filtros activos cuando cambian
  const updateActiveFilters = () => {
    const filters = [];
    if (channelFilter !== 'all') {
      const channelName = channels?.find(c => c.channelId === channelFilter)?.name || "Canal seleccionado";
      filters.push(channelName);
    }
    if (onlyEvergreen) filters.push("Solo Evergreen");
    if (onlyAnalyzed) filters.push("Solo Analizados");
    setActiveFilters(filters);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2 flex-wrap">
        <Select
          value={channelFilter}
          onValueChange={(value) => {
            setChannelFilter(value);
            setCurrentPage(1);
            updateActiveFilters();
          }}
        >
          <SelectTrigger className="h-10 min-w-[180px] max-w-[220px]">
            <SelectValue placeholder="Filtrar por canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los canales</SelectItem>
            {channels?.map((channel) => (
              <SelectItem key={channel.channelId} value={channel.channelId}>
                {channel.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {setOnlyEvergreen && setOnlyAnalyzed && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10" aria-label="Más filtros">
                <Filter className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Filtros</span>
                {activeFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-2 px-1 py-0 h-5">
                    {activeFilters.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Filtros adicionales</h4>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="only-evergreen" 
                    checked={onlyEvergreen}
                    onCheckedChange={(checked) => {
                      setOnlyEvergreen(checked);
                      setCurrentPage(1);
                      updateActiveFilters();
                    }}
                  />
                  <Label htmlFor="only-evergreen">Solo Evergreen</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="only-analyzed" 
                    checked={onlyAnalyzed}
                    onCheckedChange={(checked) => {
                      setOnlyAnalyzed(checked);
                      setCurrentPage(1);
                      updateActiveFilters();
                    }}
                  />
                  <Label htmlFor="only-analyzed">Solo Analizados</Label>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {refreshData && (
          <Button
            variant="outline"
            onClick={refreshData}
            disabled={isRefreshing}
            className="h-10"
            aria-label="Actualizar datos"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RotateCw className="h-4 w-4 mr-2" />
            )}
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
        )}

        <Button
          variant="outline"
          onClick={handleDownloadCSV}
          disabled={isDownloading}
          className="h-10 ml-auto"
          aria-label="Descargar CSV"
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          <span className="hidden sm:inline">Exportar</span>
        </Button>
      </div>
      
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
          <span>Filtros activos:</span>
          {activeFilters.map((filter, index) => (
            <Badge key={index} variant="secondary" className="font-normal">
              {filter}
            </Badge>
          ))}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-xs"
            onClick={() => {
              if (setOnlyEvergreen) setOnlyEvergreen(false);
              if (setOnlyAnalyzed) setOnlyAnalyzed(false);
              setChannelFilter('all');
              setCurrentPage(1);
              setActiveFilters([]);
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  );
}