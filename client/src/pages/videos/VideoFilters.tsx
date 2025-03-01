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
import { VideoStatus } from "@db/schema";

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
  visibleStates?: readonly VideoStatus[] | string[];
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
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-4 h-4 text-muted-foreground" />
        </div>
        <Input
          placeholder="Buscar por título, serie, descripción, creador u optimizador"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full md:w-[400px] pl-10 h-10 text-base border-muted/60 bg-gradient-to-br from-background to-muted/5 hover:border-primary/30 focus-visible:ring-primary/20"
        />
      </div>

      {showFilters && (
        <div className="grid gap-4 p-6 border border-muted/60 rounded-xl bg-gradient-to-br from-background to-primary/5 shadow-sm md:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Estado</label>
            <StatusFilter status={status} onStatusChange={onStatusChange} visibleStates={visibleStates} />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Asignado a</label>
            <AssigneeFilter
              assignedTo={assignedTo}
              onAssignedToChange={onAssignedToChange}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Proyecto</label>
            <ProjectFilter
              projectId={projectId}
              onProjectChange={onProjectChange}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Rango de fechas</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal border-muted/60 bg-background hover:bg-background hover:border-primary/30",
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
        </div>
      )}
    </div>
  );
}
