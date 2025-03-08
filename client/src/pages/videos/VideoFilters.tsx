import { StatusFilter } from "./filters/StatusFilter";
import { AssigneeFilter } from "./filters/AssigneeFilter";
import { ProjectFilter } from "./filters/ProjectFilter";
import { Button } from "@/components/ui/button";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface VideoFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  date: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  assignedTo: string;
  onAssignedToChange: (value: string) => void;
  projectId: string;
  onProjectChange: (value: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  visibleStates?: readonly string[];
}

export function VideoFilters({
  searchTerm,
  onSearchChange,
  status,
  onStatusChange,
  date,
  onDateChange,
  assignedTo,
  onAssignedToChange,
  projectId,
  onProjectChange,
  showFilters,
  onToggleFilters,
  visibleStates,
}: VideoFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Barra de búsqueda siempre visible */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar videos por título, descripción, creador..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 w-full"
        />
      </div>

      {/* Filtros adicionales (colapsables) */}
      {showFilters && (
        <div className="grid gap-4 p-4 border rounded-lg bg-card md:grid-cols-4 relative overflow-hidden">
          {/* Gradiente sutil para filtros */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/50 via-primary/50 to-violet-500/50"></div>
          <StatusFilter 
            status={status} 
            onStatusChange={onStatusChange} 
            visibleStates={visibleStates} 
          />
          <AssigneeFilter
            assignedTo={assignedTo}
            onAssignedToChange={onAssignedToChange}
          />
          <ProjectFilter
            projectId={projectId}
            onProjectChange={onProjectChange}
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y", { locale: es })} -{" "}
                      {format(date.to, "LLL dd, y", { locale: es })}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y", { locale: es })
                  )
                ) : (
                  <span>Seleccionar fechas</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={onDateChange}
                numberOfMonths={2}
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
