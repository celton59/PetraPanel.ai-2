import React, { useEffect, useRef, useState } from 'react';
import { Search as SearchIcon, X, FileText, Users, Settings, FolderClosed } from 'lucide-react';
import { useLocation } from 'wouter';
import { useGlobalSearch, type SearchItem, type SearchItemType } from '@/hooks/use-global-search';
import { useUser } from '@/hooks/use-user';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate, getInitials } from '@/lib/utils';

// Mapa de iconos para tipos de elementos
const typeIcons: Record<SearchItemType, React.FC<React.SVGProps<SVGSVGElement>>> = {
  video: FileText,
  project: FolderClosed,
  user: Users,
  channel: FileText,
  settings: Settings,
};

// Componente que muestra un resultado individual
const SearchResultItem = ({ 
  item, 
  onSelect 
}: { 
  item: SearchItem; 
  onSelect: (item: SearchItem) => void 
}) => {
  const Icon = typeIcons[item.type];
  
  return (
    <CommandItem
      key={`${item.type}-${item.id}`}
      value={`${item.type}-${item.id}-${item.title}`}
      onSelect={() => onSelect(item)}
      className="flex items-center gap-3 px-4 py-3 cursor-pointer"
    >
      {/* Icono o thumbnail */}
      {item.thumbnail ? (
        <Avatar className="h-8 w-8 rounded-md">
          <AvatarImage src={item.thumbnail} alt={item.title} />
          <AvatarFallback className="rounded-md bg-primary/10">
            {item.icon || <Icon className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
          {item.icon ? (
            <span className="text-sm">{item.icon}</span>
          ) : (
            <Icon className="h-4 w-4" />
          )}
        </div>
      )}
      
      {/* Información */}
      <div className="flex flex-col">
        <span className="font-medium text-sm">{item.title}</span>
        {item.subtitle && (
          <span className="text-xs text-muted-foreground">{item.subtitle}</span>
        )}
      </div>
      
      {/* Extras: fecha, estado o etiquetas */}
      <div className="ml-auto flex items-center gap-2">
        {item.status && (
          <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
            {item.status}
          </Badge>
        )}
        {item.date && (
          <span className="text-xs text-muted-foreground">
            {formatDate(new Date(item.date), false)}
          </span>
        )}
      </div>
    </CommandItem>
  );
};

// Componente principal para la búsqueda global
export function GlobalSearch() {
  const { 
    isOpen, 
    setOpen, 
    query, 
    setQuery, 
    results, 
    isLoading, 
    search,
    searchHistory,
    recentlyVisited,
    addToRecentlyVisited,
    clearHistory
  } = useGlobalSearch();
  
  const [location, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Filtrar resultados según la pestaña activa
  const getFilteredResults = () => {
    if (activeTab === 'all') return results;
    return results.filter(item => item.type === activeTab);
  };
  
  // Obtener resultados agrupados por tipo
  const getGroupedResults = () => {
    const grouped: Record<SearchItemType, SearchItem[]> = {
      video: [],
      project: [],
      user: [],
      channel: [],
      settings: []
    };
    
    results.forEach((item: SearchItem) => {
      grouped[item.type].push(item);
    });
    
    return grouped;
  };
  
  // Manejar selección de un resultado
  const handleSelect = (item: SearchItem) => {
    addToRecentlyVisited(item);
    setOpen(false);
    navigate(item.url);
  };
  
  // Enfocar input al abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);
  
  // Escuchar atajo de teclado Ctrl+K o Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        e.preventDefault();
        setOpen(true);
      }
      
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setOpen]);
  
  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 max-w-3xl">
        <Command className="rounded-lg shadow-md border">
          <div className="flex items-center px-3 border-b">
            <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              ref={inputRef}
              value={query}
              onValueChange={setQuery}
              placeholder="Buscar en todo el panel..."
              className="flex-1 h-12 outline-none"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuery('')}
                className="h-7 w-7"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <div className="text-xs text-muted-foreground px-2 border-l ml-2">
              ESC
            </div>
          </div>
          
          <div className="border-b">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <div className="px-3 pt-2">
                <TabsList className="w-full bg-transparent justify-start">
                  <TabsTrigger value="all" className="flex-none text-xs px-3">
                    Todo
                  </TabsTrigger>
                  <TabsTrigger value="video" className="flex-none text-xs px-3">
                    Videos
                  </TabsTrigger>
                  <TabsTrigger value="project" className="flex-none text-xs px-3">
                    Proyectos
                  </TabsTrigger>
                  <TabsTrigger value="user" className="flex-none text-xs px-3">
                    Usuarios
                  </TabsTrigger>
                  <TabsTrigger value="channel" className="flex-none text-xs px-3">
                    Canales
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex-none text-xs px-3">
                    Configuración
                  </TabsTrigger>
                </TabsList>
              </div>
            </Tabs>
          </div>
          
          <CommandList className="max-h-[60vh] min-h-[200px] overflow-hidden">
            <ScrollArea className="h-full max-h-[60vh]">
              {query ? (
                <>
                  {isLoading ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Buscando...
                    </div>
                  ) : (
                    <>
                      <CommandEmpty className="py-6 text-center">
                        No se encontraron resultados para "{query}"
                      </CommandEmpty>
                      
                      {activeTab === 'all' ? (
                        // Mostrar resultados agrupados por tipo
                        Object.entries(getGroupedResults()).map(([type, items]) => (
                          items.length > 0 && (
                            <CommandGroup key={type} heading={
                              type === 'video' ? 'Videos' :
                              type === 'project' ? 'Proyectos' :
                              type === 'user' ? 'Usuarios' :
                              type === 'channel' ? 'Canales' :
                              'Configuración'
                            }>
                              {items.map(item => (
                                <SearchResultItem 
                                  key={`${item.type}-${item.id}`}
                                  item={item} 
                                  onSelect={handleSelect}
                                />
                              ))}
                            </CommandGroup>
                          )
                        ))
                      ) : (
                        // Mostrar resultados filtrados por tipo
                        <CommandGroup>
                          {getFilteredResults().map(item => (
                            <SearchResultItem 
                              key={`${item.type}-${item.id}`}
                              item={item} 
                              onSelect={handleSelect}
                            />
                          ))}
                        </CommandGroup>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* Historial de búsqueda */}
                  {searchHistory.length > 0 && (
                    <CommandGroup heading="Búsquedas recientes">
                      <div className="flex items-center justify-between px-4 py-1">
                        <span className="text-xs text-muted-foreground">
                          Últimas {searchHistory.length} búsquedas
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={clearHistory}
                          className="h-7 text-xs"
                        >
                          Limpiar historial
                        </Button>
                      </div>
                      
                      {searchHistory.slice(0, 5).map((item) => (
                        <CommandItem
                          key={`history-${item.timestamp}`}
                          value={item.query}
                          onSelect={() => search(item.query)}
                          className="flex items-center gap-2 px-4 py-2"
                        >
                          <SearchIcon className="h-4 w-4 opacity-50" />
                          <span>{item.query}</span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {formatDate(new Date(item.timestamp), false)}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  
                  {/* Elementos visitados recientemente */}
                  {recentlyVisited.length > 0 && (
                    <CommandGroup heading="Visitados recientemente">
                      {recentlyVisited.map((item) => (
                        <SearchResultItem 
                          key={`recent-${item.type}-${item.id}`}
                          item={item} 
                          onSelect={handleSelect}
                        />
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </ScrollArea>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}