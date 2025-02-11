import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Project } from "@db/schema";
import { useProjects } from "@/hooks/useProjects";

interface ProjectSelectorProps {
  value: number | null;
  onChange: (project: Project) => void;
}

export function ProjectSelector({ value, onChange }: ProjectSelectorProps) {

  const { projects } = useProjects() 
  
  return (
    <Select
      value={value?.toString() || ""}
      onValueChange={ value => onChange( projects.find( p => p.id === parseInt(value) )! )}
    >
      <SelectTrigger>
        <SelectValue placeholder="Selecciona un proyecto" />
      </SelectTrigger>
      <SelectContent>
        {projects.map( p => (
          <SelectItem key={p.id} value={p.id.toString()}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
