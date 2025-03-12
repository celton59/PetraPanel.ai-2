import React from 'react';
import { Building2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import api from "../../../lib/axios";

interface ProjectFilterProps {
  projectId: string;
  onProjectChange: (projectId: string) => void;
}

export const ProjectFilter = ({ projectId, onProjectChange }: ProjectFilterProps) => {
  const { data: projects } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      try {
        // Usamos la instancia de axios configurada con protección CSRF
        const response = await api.get('/api/projects');
        return response.data.data;
      } catch (error: any) {
        console.error("Error fetching projects:", error);
        throw new Error(error.response?.data?.message || 'Error fetching projects');
      }
    }
  });

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        Proyecto
      </label>
      <Select value={projectId} onValueChange={onProjectChange}>
        <SelectTrigger className="w-full bg-background">
          <SelectValue placeholder="Seleccionar proyecto" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los proyectos</SelectItem>
          {projects?.map((project: any) => (
            <SelectItem key={project.id} value={project.id.toString()}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
