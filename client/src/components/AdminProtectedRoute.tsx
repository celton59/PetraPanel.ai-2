import React from 'react';
import { useUser } from '@/hooks/use-user';
import { useLocation } from 'wouter';
import AccessDenied from '@/pages/admin/AccessDenied';
import { Layout } from './layout/Layout';
import { AdminLayout } from './layout/AdminLayout';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
  component: React.ComponentType;
}

export function AdminProtectedRoute({ component: Component }: AdminProtectedRouteProps) {
  const { user, isLoading } = useUser();
  const [, navigate] = useLocation();
  
  // Mostrar spinner mientras carga
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Si no hay usuario, redirigir al login
  if (!user) {
    navigate('/');
    return null;
  }
  
  // Si el usuario no es administrador, mostrar página de acceso denegado
  if (user.role !== 'admin') {
    return <AccessDenied />;
  }
  
  // El usuario es admin, mostrar el componente dentro del layout de administración
  return (
    <AdminLayout>
      <Component />
    </AdminLayout>
  );
}