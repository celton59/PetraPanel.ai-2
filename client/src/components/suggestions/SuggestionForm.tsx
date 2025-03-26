import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SuggestionFormData, useSuggestions } from '@/hooks/useSuggestions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Esquema de validación para el formulario
const formSchema = z.object({
  title: z.string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(255, 'El título no puede exceder 255 caracteres'),
  description: z.string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(2000, 'La descripción no puede exceder 2000 caracteres'),
  category: z.string().min(1, 'Selecciona una categoría'),
});

export function SuggestionForm() {
  const { categories, createSuggestion } = useSuggestions();

  const form = useForm<SuggestionFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'general',
    },
  });

  const onSubmit = async (data: SuggestionFormData) => {
    await createSuggestion.mutateAsync(data);
    form.reset();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Enviar sugerencia</CardTitle>
        <CardDescription>
          Ayúdanos a mejorar PetraPanel compartiendo tus ideas, reportando problemas o sugiriendo mejoras.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Resumen breve de tu sugerencia" {...field} />
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
                        <div className="flex items-center justify-center py-2">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Cargando...
                        </div>
                      ) : (
                        categories.data?.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))
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
                      placeholder="Describe detalladamente tu idea, sugerencia o el problema que has encontrado"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={createSuggestion.isPending}
              >
                {createSuggestion.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Enviar sugerencia
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}