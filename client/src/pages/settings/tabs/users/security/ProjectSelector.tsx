import { Command } from "cmdk";
import { Building2, Search, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { useProjects } from "@/hooks/useProjects";
import { ProjectBadges } from "./ProjectBadges";

interface ProjectSelectorProps {
  selectedProjects?: number[];
  setSelectedProjects?: (projects: number[]) => void;
}

export function ProjectSelector({ selectedProjects = [], setSelectedProjects }: ProjectSelectorProps) {
  const { projects, isLoading } = useProjects();

  const toggleProject = (projectId: number) => {
    if (!setSelectedProjects) return;

    setSelectedProjects(
      selectedProjects?.includes(projectId)
        ? selectedProjects.filter((id) => id !== projectId)
        : [...(selectedProjects || []), projectId]
    );
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Building2 className="h-4 w-4 animate-pulse" />
          <span className="animate-pulse">Cargando proyectos...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border shadow-sm transition-all duration-200 hover:shadow-md">
        <Command className="rounded-lg">
          <div className="flex items-center border-b px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input 
              placeholder="Buscar proyectos..." 
              className="flex h-10 w-full rounded-lg bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus:ring-0 pl-2"
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            {projects.length === 0 ? (
              <Command.Empty className="py-6 text-center text-sm">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Search className="h-8 w-8" />
                  <p>No se encontraron proyectos</p>
                </div>
              </Command.Empty>
            ) : (
              <Command.Group className="space-y-1">
                <AnimatePresence mode="wait">
                  {projects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15, delay: index * 0.05 }}
                      layout
                    >
                      <Command.Item
                        value={project.name}
                        onSelect={() => toggleProject(project.id)}
                        className="group flex items-center justify-between px-4 py-3 cursor-pointer rounded-md hover:bg-accent data-[selected]:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-md transition-colors",
                            selectedProjects?.includes(project.id)
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground group-hover:text-foreground"
                          )}>
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">{project.name}</span>
                            <span className="text-xs text-muted-foreground">ID: {project.id}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedProjects?.includes(project.id) ? (
                            <Check className="h-4 w-4 text-primary shrink-0" />
                          ) : (
                            <Plus className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </Command.Item>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </Card>

      <ProjectBadges
        selectedProjects={selectedProjects}
        projects={projects}
        onToggleProject={toggleProject}
      />
    </div>
  );
}