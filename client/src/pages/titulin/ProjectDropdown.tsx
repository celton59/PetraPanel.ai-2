import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjects } from "@/hooks/useProjects";

interface ProjectDropdownProps {
  value: number | null;
  onChange: (projectId: number) => void;
}

export function ProjectDropdown({ value, onChange }: ProjectDropdownProps) {
  const { projects } = useProjects() 
  
  return (
    <Select
      value={value?.toString() || ""}
      onValueChange={value => onChange(parseInt(value))}
    >
      <SelectTrigger>
        <SelectValue placeholder="Selecciona un proyecto" />
      </SelectTrigger>
      <SelectContent>
        {projects.map(p => (
          <SelectItem key={p.id} value={p.id.toString()}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}