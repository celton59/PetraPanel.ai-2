import { Link } from "wouter";
import { User } from "@/types/user";
import { Button } from "@/components/ui/button";
import { Filter, Grid3x3, LayoutGrid, List, Recycle, Plus, CheckSquare } from "lucide-react";

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
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-2xl font-bold tracking-tight">Videos</h1>
      
      <div className="flex items-center gap-2">
        {/* View Mode Toggles */}
        <div className="hidden sm:flex border rounded-md overflow-hidden">
          <Button 
            variant={viewMode === "grid" ? "default" : "ghost"} 
            size="sm"
            className="rounded-none border-0"
            onClick={() => setViewMode("grid")}
            title="Vista de cuadrícula"
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button 
            variant={viewMode === "table" ? "default" : "ghost"} 
            size="sm"
            className="rounded-none border-0"
            onClick={() => setViewMode("table")}
            title="Vista de tabla"
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button 
            variant={viewMode === "list" ? "default" : "ghost"} 
            size="sm"
            className="rounded-none border-0"
            onClick={() => setViewMode("list")}
            title="Vista de lista"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Selection Mode Toggle */}
        {user?.role === "admin" && (
          <Button 
            variant={selectMode ? "default" : "outline"} 
            size="sm"
            onClick={toggleSelectionMode}
            className="gap-2"
            title="Modo selección"
          >
            <CheckSquare className="w-4 h-4" />
            Selección
          </Button>
        )}
        
        {/* Filters Toggle */}
        <Button 
          variant={showFilters ? "default" : "outline"} 
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          Filtros
        </Button>
        
        {user?.role === "admin" && (
          <>
            <Button onClick={() => setNewVideoDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Video
            </Button>
            <Link href="/videos/trash">
              <Button 
                variant="outline" 
                className="gap-2"
              >
                <Recycle className="w-4 h-4" />
                Papelera
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}