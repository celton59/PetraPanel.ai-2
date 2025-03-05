import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProjectForm } from "./ProjectForm";
import { ProjectEditDialog } from "./ProjectEditDialog";
import { useProjects } from "@/hooks/useProjects";
import { Project } from '@db/schema'

export function ProjectsTab () {
  const { projects, isLoading, createProject, updateProject, deleteProject } = useProjects();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddProject = async (projectData: Pick<Project, "name" | "description" | "prefix">) => {
    setIsSubmitting(true);
    try {
      await createProject(projectData);
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProject = async (projectData: Pick<Project, "name" | "description" | "prefix" |"id">) => {
    setIsSubmitting(true);
    try {
      await updateProject({
        id: projectData.id,
        project: {
          name: projectData.name,
          prefix: projectData.prefix,
          description: projectData.description,
        },
      });
    } catch (error) {
      console.error('Error updating project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este proyecto?")) return;
    try {
      await deleteProject(id);
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProjectForm 
        isSubmitting={isSubmitting}
        onAddProject={handleAddProject}
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Prefijo</TableHead>
            <TableHead>Último número</TableHead>
            <TableHead className="w-[100px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell>{project.name || 'Sin nombre'}</TableCell>
              <TableCell>{project.prefix || 'Sin prefijo'}</TableCell>
              <TableCell>{project.current_number ? String(project.current_number).padStart(4, "0") : '0000'}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <ProjectEditDialog
                    project={project}
                    isSubmitting={isSubmitting}
                    onUpdateProject={handleUpdateProject}
                  />
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDeleteProject(project.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};