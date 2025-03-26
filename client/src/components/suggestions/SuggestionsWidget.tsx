import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquareHeart, ChevronRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'wouter';
import { useSuggestions } from '@/hooks/useSuggestions';
import { Skeleton } from '@/components/ui/skeleton';

export function SuggestionsWidget() {
  const { allSuggestions } = useSuggestions();
  
  // Si está cargando, mostrar un esqueleto
  if (allSuggestions.isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            <Skeleton className="h-4 w-[200px]" />
          </CardTitle>
          <Skeleton className="h-8 w-8 rounded-full" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <Skeleton className="h-8 w-16" />
          </div>
          <p className="text-xs text-muted-foreground">
            <Skeleton className="h-4 w-[150px] mt-1" />
          </p>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-8 w-full" />
        </CardFooter>
      </Card>
    );
  }
  
  // Si hay error, mostrar un widget simplificado
  if (allSuggestions.isError) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Sugerencias Pendientes</CardTitle>
          <MessageSquareHeart className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">--</div>
          <p className="text-xs text-muted-foreground">Cargando datos...</p>
        </CardContent>
        <CardFooter className="p-0">
          <Link href="/sugerencias">
            <Button variant="ghost" className="w-full h-9 px-4 py-2 rounded-t-none justify-between">
              <span>Gestionar sugerencias</span>
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }
  
  // Contar sugerencias pendientes y recientes
  const suggestions = allSuggestions.data || [];
  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
  const recentSuggestions = suggestions.filter(s => {
    const date = new Date(s.created_at);
    const now = new Date();
    // Sugerencias de los últimos 7 días
    return (now.getTime() - date.getTime()) < 7 * 24 * 60 * 60 * 1000;
  });
  
  // Calcular porcentaje de cambio en comparación con la semana anterior
  const percentChange = recentSuggestions.length > 0 
    ? `+${recentSuggestions.length} nuevas esta semana` 
    : "Sin sugerencias nuevas esta semana";
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          Sugerencias Pendientes
        </CardTitle>
        <MessageSquareHeart className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {pendingSuggestions.length}
        </div>
        <p className="text-xs text-muted-foreground">
          {percentChange}
        </p>
      </CardContent>
      <CardFooter className="p-0">
        <Link href="/sugerencias">
          <Button variant="ghost" className="w-full h-9 px-4 py-2 rounded-t-none justify-between">
            <span>Gestionar sugerencias</span>
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}