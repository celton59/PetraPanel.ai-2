import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

interface ProjectSelectorProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

export function ProjectSelector({ value, onChange }: ProjectSelectorProps) {
  const { data: projectsResponse } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects");
      if (!response.ok) {
        throw new Error("Error al cargar los proyectos");
      }
      return response.json();
    }
  });

  const projects = projectsResponse?.data || [];

  return (
    <Select
      value={value?.toString() || ""}
      onValueChange={(value) => onChange(value ? parseInt(value) : null)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Selecciona un proyecto" />
      </SelectTrigger>
      <SelectContent>
        {projects.map((project: any) => (
          <SelectItem key={project.id} value={project.id.toString()}>
            {project.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
