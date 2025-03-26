import React from 'react';
import { useSuggestions, Suggestion } from '@/hooks/useSuggestions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function UserSuggestionList() {
  const { userSuggestions } = useSuggestions();

  // Estados de carga y error
  if (userSuggestions.isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-8 w-48" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-full" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (userSuggestions.isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          No se pudieron cargar tus sugerencias. Por favor, intenta de nuevo más tarde.
        </AlertDescription>
      </Alert>
    );
  }

  const suggestions = userSuggestions.data;

  // Función para obtener el color del badge según el estado
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'reviewed':
        return 'outline';
      case 'implemented':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Función para traducir el estado
  const getStatusTranslation = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'reviewed':
        return 'En revisión';
      case 'implemented':
        return 'Implementada';
      case 'rejected':
        return 'Rechazada';
      default:
        return status;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Mis sugerencias</CardTitle>
        <CardDescription>
          Historial de sugerencias que has enviado y su estado actual
        </CardDescription>
      </CardHeader>
      <CardContent>
        {suggestions && (suggestions.length > 0) ? (
          <div className="space-y-4">
            {(suggestions || []).map((suggestion: Suggestion) => (
              <div key={suggestion.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{suggestion.title}</h3>
                  <Badge variant={getStatusBadgeVariant(suggestion.status)}>
                    {getStatusTranslation(suggestion.status)}
                  </Badge>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>{suggestion.category}</span>
                  <span className="mx-2">•</span>
                  <span>
                    {format(new Date(suggestion.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                  </span>
                </div>
                <p className="text-sm mt-2">{suggestion.description}</p>
                {suggestion.adminNotes && (
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <p className="text-sm font-semibold">Respuesta del administrador:</p>
                    <p className="text-sm">{suggestion.adminNotes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Aún no has enviado ninguna sugerencia. ¡Ayúdanos a mejorar!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}