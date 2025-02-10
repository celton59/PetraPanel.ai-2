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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Project } from '@db/schema'

const projectSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  prefix: z.string().min(1, "El prefijo es requerido")
});

interface ProjectFormProps {
  isSubmitting: boolean;
  onAddProject: (data: Pick<Project, 'name' | 'prefix' | 'description'>) => Promise<void>;
}

export function ProjectForm({ isSubmitting, onAddProject }: ProjectFormProps) {
  const form = useForm<Pick<Project, 'name' | 'prefix' | 'description'>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      prefix: "",
    },
  });

  const onSubmit = async (data: Pick<Project, 'name' | 'prefix' | 'description'>) => {
    try {
      await onAddProject({
        name: data.name,
        prefix: data.prefix,
        description: null
      });
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
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creando..." : "Crear Proyecto"}
        </Button>
      </form>
    </Form>
  );
}
