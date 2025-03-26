import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSuggestions } from '@/hooks/useSuggestions';
import { Loader2 } from 'lucide-react';

// Esquema de validación para el formulario de sugerencias
const suggestionFormSchema = z.object({
  title: z.string().min(3, {
    message: 'El título debe tener al menos 3 caracteres',
  }).max(255, {
    message: 'El título no puede tener más de 255 caracteres',
  }),
  description: z.string().min(10, {
    message: 'La descripción debe tener al menos 10 caracteres',
  }).max(2000, {
    message: 'La descripción no puede tener más de 2000 caracteres',
  }),
  category: z.string().min(1, {
    message: 'Selecciona una categoría',
  }),
});

// Tipo para los valores del formulario
type SuggestionFormValues = z.infer<typeof suggestionFormSchema>;

export function SuggestionForm() {
  const { createSuggestion, categories } = useSuggestions();
  
  // Inicializar el formulario con react-hook-form
  const form = useForm<SuggestionFormValues>({
    resolver: zodResolver(suggestionFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
    },
  });
  
  // Manejar el envío del formulario
  const onSubmit = async (values: SuggestionFormValues) => {
    await createSuggestion.mutateAsync(values);
    form.reset();
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Resumen breve de tu sugerencia" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.isLoading ? (
                    <div className="flex justify-center items-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : categories.data ? (
                    categories.data.map((category: string) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="general">General</SelectItem>
                  )}
                </SelectContent>
              </Select>
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
                <Textarea 
                  placeholder="Describe tu sugerencia con detalle" 
                  className="min-h-[150px] resize-y"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={createSuggestion.isPending}
        >
          {createSuggestion.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Enviar sugerencia
        </Button>
      </form>
    </Form>
  );
}