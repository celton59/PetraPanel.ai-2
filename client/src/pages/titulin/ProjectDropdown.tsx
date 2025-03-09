import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjects } from "@/hooks/useProjects";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Project } from "@db/schema";

interface ProjectDropdownProps {
  value: number | null;
  onChange: (projectId: number) => void;
}

export function ProjectDropdown({ value, onChange }: ProjectDropdownProps) {
  // Utilizamos el hook existente para obtener los proyectos
  const { projects, isLoading } = useProjects();
  
  return (
    <Select
      value={value?.toString() || ""}
      onValueChange={value => onChange(parseInt(value))}
      disabled={isLoading}
    >
      <SelectTrigger>
        <SelectValue placeholder={isLoading ? "Cargando proyectos..." : "Selecciona un proyecto"} />
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
  );
}