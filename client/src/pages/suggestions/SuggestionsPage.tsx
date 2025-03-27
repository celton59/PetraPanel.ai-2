import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SuggestionForm } from '@/components/suggestions/SuggestionForm';
import { UserSuggestionList } from '@/components/suggestions/UserSuggestionList';
import { AdminSuggestionList } from '@/components/suggestions/AdminSuggestionList';
import { useUser } from '@/hooks/use-user';

export default function SuggestionsPage() {
  const { user } = useUser();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-6">
        Sistema de Sugerencias
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Formulario de envío */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg shadow-sm p-6 border">
            <h2 className="text-xl font-semibold mb-4">
              Envía tu sugerencia
            </h2>
            <p className="text-muted-foreground mb-6">
              Tus ideas son valiosas para mejorar PetraPanel. Comparte tus sugerencias y ayúdanos a crear una mejor experiencia para todos.
            </p>
            <SuggestionForm />
          </div>
        </div>
        
        {/* Columna derecha - Listados de sugerencias */}
        <div className="lg:col-span-2">
          {isAdmin ? (
            <Tabs defaultValue="admin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="admin">Administrar sugerencias</TabsTrigger>
                <TabsTrigger value="user">Mis sugerencias</TabsTrigger>
              </TabsList>
              <TabsContent value="admin">
                <AdminSuggestionList />
              </TabsContent>
              <TabsContent value="user">
                <UserSuggestionList />
              </TabsContent>
            </Tabs>
          ) : (
            <UserSuggestionList />
          )}
        </div>
      </div>
    </div>
  );
}