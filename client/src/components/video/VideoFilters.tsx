import { SearchInput } from "./filters/SearchInput";
import { StatusFilter } from "./filters/StatusFilter";
import { AssigneeFilter } from "./filters/AssigneeFilter";
import { ProjectFilter } from "./filters/ProjectFilter";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

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
}: VideoFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex-1">
        <SearchInput 
          searchTerm={searchTerm} 
          onSearchChange={onSearchChange} 
        />
    </div>

      {showFilters && (
        <div className="grid gap-4 p-4 border rounded-lg bg-card md:grid-cols-4">
          <StatusFilter status={status} onStatusChange={onStatusChange} />
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
