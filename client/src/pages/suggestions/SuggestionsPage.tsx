import React from 'react';
import { SuggestionForm } from '@/components/suggestions/SuggestionForm';
import { UserSuggestionList } from '@/components/suggestions/UserSuggestionList';
import { AdminSuggestionList } from '@/components/suggestions/AdminSuggestionList';
import { useUser } from '@/hooks/use-user';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SuggestionsPage() {
  const { user } = useUser();

  // Determinar si el usuario es administrador
  const isAdmin = user?.role === 'admin';

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Buzón de sugerencias</h1>
      
      {isAdmin ? (
        <Tabs defaultValue="manage">
          <TabsList className="mb-6">
            <TabsTrigger value="manage">Administrar sugerencias</TabsTrigger>
            <TabsTrigger value="submit">Enviar sugerencia</TabsTrigger>
            <TabsTrigger value="my">Mis sugerencias</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manage">
            <AdminSuggestionList />
          </TabsContent>
          
          <TabsContent value="submit">
            <div className="max-w-2xl mx-auto">
              <SuggestionForm />
            </div>
          </TabsContent>
          
          <TabsContent value="my">
            <div className="max-w-3xl mx-auto">
              <UserSuggestionList />
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <SuggestionForm />
          </div>
          <div>
            <UserSuggestionList />
          </div>
        </div>
      )}
    </div>
  );
}