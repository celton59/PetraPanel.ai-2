import { Badge } from "@/components/ui/badge";
import { Building2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Project } from "@/types/project";

interface ProjectBadgesProps {
  selectedProjects: number[];
  projects: Project[];
  onToggleProject: (projectId: number) => void;
}

export const ProjectBadges = ({ selectedProjects, projects, onToggleProject }: ProjectBadgesProps) => {
  if (!selectedProjects?.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <AnimatePresence mode="popLayout">
        {selectedProjects.map((projectId, index) => {
          const project = projects.find(p => p.id === projectId);
          if (!project) return null;
          
          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              layout
            >
              <Badge
                variant="secondary"
                className="pl-2 pr-2 py-1.5 hover:bg-secondary/80 transition-colors cursor-pointer flex items-center gap-2 group"
                onClick={() => onToggleProject(project.id)}
              >
                <Building2 className="h-3 w-3 text-primary" />
                <span className="text-sm font-medium">{project.name}</span>
                <X className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Badge>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
