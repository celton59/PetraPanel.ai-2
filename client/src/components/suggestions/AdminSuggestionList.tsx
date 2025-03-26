import React, { useState } from 'react';
import { useSuggestions } from '@/hooks/useSuggestions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, 
  AlertCircle, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';

export function AdminSuggestionList() {
  const { allSuggestions, updateSuggestionStatus, filters, setFilters, categories } = useSuggestions();
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Estados de carga y error
  if (allSuggestions.isLoading) {
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

  if (allSuggestions.isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          No se pudieron cargar las sugerencias. Por favor, intenta de nuevo más tarde.
        </AlertDescription>
      </Alert>
    );
  }

  const suggestions = allSuggestions.data;

  const handleStatusUpdate = async () => {
    if (!selectedSuggestion || !status) return;

    await updateSuggestionStatus.mutateAsync({
      id: selectedSuggestion,
      data: {
        status,
        adminNotes: adminNotes.trim() || undefined
      }
    });

    setDialogOpen(false);
    setSelectedSuggestion(null);
    setStatus('');
    setAdminNotes('');
  };

  const openUpdateDialog = (suggestionId: number, currentStatus: string, currentNotes?: string) => {
    setSelectedSuggestion(suggestionId);
    setStatus(currentStatus);
    setAdminNotes(currentNotes || '');
    setDialogOpen(true);
  };

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

  // Función para obtener el icono de estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'reviewed':
        return <Loader2 className="h-4 w-4" />;
      case 'implemented':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Administrar sugerencias</CardTitle>
            <CardDescription>
              Gestiona las sugerencias de los usuarios y actualiza su estado
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showFilters && (
          <div className="mb-6 p-4 border rounded-lg grid gap-4 grid-cols-1 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar sugerencias..."
                  className="pl-8"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Categoría</label>
              <Select
                value={filters.category}
                onValueChange={(value) => setFilters({ ...filters, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las categorías</SelectItem>
                  {categories.data?.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Estado</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="reviewed">En revisión</SelectItem>
                  <SelectItem value="implemented">Implementada</SelectItem>
                  <SelectItem value="rejected">Rechazada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {suggestions && suggestions.length > 0 ? (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{suggestion.title}</h3>
                  <Badge variant={getStatusBadgeVariant(suggestion.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(suggestion.status)}
                      {getStatusTranslation(suggestion.status)}
                    </span>
                  </Badge>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>Por: {suggestion.userName || 'Usuario'}</span>
                  <span className="mx-2">•</span>
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
                <div className="flex justify-end pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openUpdateDialog(suggestion.id, suggestion.status, suggestion.adminNotes)}
                  >
                    Actualizar estado
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No hay sugerencias que coincidan con los filtros seleccionados.
            </p>
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Actualizar estado de la sugerencia</DialogTitle>
              <DialogDescription>
                Cambia el estado de la sugerencia y proporciona retroalimentación al usuario.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="reviewed">En revisión</SelectItem>
                    <SelectItem value="implemented">Implementada</SelectItem>
                    <SelectItem value="rejected">Rechazada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Comentarios (opcional)</label>
                <Textarea
                  placeholder="Proporciona retroalimentación o más información para el usuario..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleStatusUpdate}
                disabled={updateSuggestionStatus.isPending || !status}
              >
                {updateSuggestionStatus.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Guardar cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}