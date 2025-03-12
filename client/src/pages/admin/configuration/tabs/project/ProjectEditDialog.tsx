import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Project } from '@db/schema'
import { useState } from "react";

const projectSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "El nombre es requerido"),
  prefix: z.string().min(1, "El prefijo es requerido"),
  description: z.string()
});

interface ProjectEditDialogProps {
  project: Project;
  isSubmitting: boolean;
  onUpdateProject: (data: Pick<Project, 'name' | 'description' | 'prefix' | 'id'>) => Promise<void>;
}

export function ProjectEditDialog({
  project,
  isSubmitting,
  onUpdateProject,
}: ProjectEditDialogProps) {

  const [opened, setOpened] = useState(false);

  console.log("PROJECT", project)
  
  const form = useForm<Pick<Project, 'name' | 'description' | 'prefix' | 'id'>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      id: project.id,
      name: project.name,
      prefix: project.prefix,
      description: project.description
    },
  });

  const onSubmit = async (data: Pick<Project, 'name' | 'prefix' | 'id' | 'description'>) => {
    try {
      await onUpdateProject({
        id: data.id,
        name: data.name,
        prefix: data.prefix,
        description: project.description
      });
      setOpened(false);
    } catch (error) {
      console.error("Error updating project:", error);
    }
  };

  return (
    <Dialog open={opened} onOpenChange={ open => setOpened(open) }>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" onClick={() => setOpened( prev => !prev)}>
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Proyecto</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Proyecto</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="prefix"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prefijo</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
