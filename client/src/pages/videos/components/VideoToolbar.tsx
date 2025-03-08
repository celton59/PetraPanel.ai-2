import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  CheckSquare,
  Grid,
  LayoutGrid,
  LayoutList,
  ListFilter,
  Plus,
  Table,
} from "lucide-react";
import { User } from "@/types/user";

interface VideoToolbarProps {
  user: User;
  viewMode: "table" | "grid" | "list";
  setViewMode: (mode: "table" | "grid" | "list") => void;
  selectMode: boolean;
  toggleSelectionMode: () => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  setNewVideoDialogOpen: (open: boolean) => void;
}

export function VideoToolbar({ 
  user,
  viewMode,
  setViewMode,
  selectMode,
  toggleSelectionMode,
  showFilters,
  setShowFilters,
  setNewVideoDialogOpen
}: VideoToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 sticky top-0 z-10 py-2 bg-background/90 backdrop-blur-sm">
      <div className="flex flex-col mb-2 md:mb-0">
        <h1 className="text-2xl font-bold mb-1">Videos</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona todos los videos del sistema
        </p>
      </div>
      
      <div className="flex flex-wrap gap-2 w-full md:w-auto">
        {/* Botón para mostrar filtros */}
        <Button
          variant={showFilters ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="text-xs"
        >
          <ListFilter className="h-3.5 w-3.5 mr-1.5" />
          Filtros
        </Button>
        
        {/* Botón para modo selección (solo admins) */}
        {user?.role === "admin" && (
          <Button
            variant={selectMode ? "default" : "outline"}
            size="sm"
            onClick={toggleSelectionMode}
            className="text-xs"
          >
            <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
            {selectMode ? "Cancelar selección" : "Seleccionar"}
          </Button>
        )}
        
        {/* Selector de vista */}
        <div className="border rounded-md overflow-hidden">
          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as "table" | "grid" | "list")}>
            <ToggleGroupItem value="grid" size="sm" className="px-2.5 py-1">
              <LayoutGrid className="h-3.5 w-3.5" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" size="sm" className="px-2.5 py-1">
              <LayoutList className="h-3.5 w-3.5" />
            </ToggleGroupItem>
            <ToggleGroupItem value="table" size="sm" className="px-2.5 py-1">
              <Table className="h-3.5 w-3.5" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        {/* Botón para crear nuevo video (solo para admin) */}
        {user?.role === "admin" && (
          <Button
            onClick={() => setNewVideoDialogOpen(true)}
            size="sm"
            className="ml-auto text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nuevo Video
          </Button>
        )}
      </div>
    </div>
  );
}