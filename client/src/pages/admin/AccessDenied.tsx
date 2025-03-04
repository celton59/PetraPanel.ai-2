import React from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export default function AccessDenied() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
          <ShieldAlert className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight">Acceso Denegado</h1>
        
        <p className="text-muted-foreground">
          No tienes permisos para acceder a la sección de administración. 
          Esta área está reservada exclusivamente para administradores del sistema.
        </p>
        
        <div className="pt-4">
          <Button 
            onClick={() => navigate('/')} 
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  );
}