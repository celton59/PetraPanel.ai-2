import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Project } from '@db/schema';
import { YouTubeChannelSelector } from "@/components/youtube/YouTubeChannelSelector";

const projectSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  prefix: z.string().min(1, "El prefijo es requerido"),
  description: z.string(),
  youtubeChannelId: z.string().nullable().optional()
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  isSubmitting: boolean;
  onAddProject: (data: ProjectFormData) => Promise<void>;
}

export function ProjectForm({ isSubmitting, onAddProject }: ProjectFormProps) {
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      prefix: "",
      description: "",
      youtubeChannelId: null
    }
  });

  const onSubmit = async (data: ProjectFormData) => {
    try {
      await onAddProject(data);
      form.reset();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Proyecto</FormLabel>
                <FormControl>
                  <Input placeholder="Mi Proyecto" {...field} />
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
                  <Input placeholder="PRJ" {...field} />
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
                  <Input placeholder="Descripción del Proyecto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="youtubeChannelId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Canal de YouTube</FormLabel>
                <FormControl>
                  <YouTubeChannelSelector 
                    value={field.value} 
                    onChange={field.onChange} 
                  />
                </FormControl>
                <FormDescription>
                  Canal al que se publicarán los videos de este proyecto
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creando..." : "Crear Proyecto"}
        </Button>
      </form>
    </Form>
  );
}
