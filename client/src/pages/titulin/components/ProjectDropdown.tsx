import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjects } from "@/hooks/useProjects";
import { Loader2 } from "lucide-react";

interface ProjectDropdownProps {
  value: number | null;
  onChange: (projectId: number) => void;
}

export function ProjectDropdown({ value, onChange }: ProjectDropdownProps) {
  const { projects, isLoading } = useProjects();
  
  return (
    <div className="relative">
      <Select
        value={value?.toString() || ""}
        onValueChange={value => onChange(parseInt(value))}
        disabled={isLoading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecciona un proyecto" />
        </SelectTrigger>
        <SelectContent>
          {projects && projects.length > 0 ? (
            projects.map(p => (
              <SelectItem key={p.id} value={p.id.toString()}>
                {p.name}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="none" disabled>
              No hay proyectos disponibles
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      
      {isLoading && (
        <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}