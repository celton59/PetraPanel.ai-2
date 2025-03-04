import React, { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { BarChart3, LayoutDashboard, Settings, DollarSign } from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

const adminSections = [
  { id: 'overview', label: 'Visión General', path: '/admin', icon: LayoutDashboard },
  { id: 'stats', label: 'Estadísticas', path: '/admin/stats', icon: BarChart3 },
  { id: 'accounting', label: 'Contabilidad', path: '/admin/accounting', icon: DollarSign },
  { id: 'configuration', label: 'Configuración', path: '/admin/configuration', icon: Settings },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  
  const getCurrentSection = () => {
    // Extraer la sección actual de la URL
    const path = location.split('/').filter(Boolean);
    if (path.length < 2) return 'overview';
    return path[1]; // La segunda parte de la ruta después de 'admin'
  };

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="border-b bg-card shadow-sm">
        <div className="container mx-auto">
          <Tabs value={getCurrentSection()} className="w-full">
            <TabsList className="w-full justify-start h-14 bg-transparent p-0">
              {adminSections.map((section) => {
                const Icon = section.icon;
                return (
                  <Link key={section.id} href={section.path}>
                    <TabsTrigger
                      value={section.id}
                      className={cn(
                        "data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-6",
                        "data-[state=active]:shadow-none data-[state=active]:bg-transparent",
                        "transition-all duration-200 hover:bg-muted/40"
                      )}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {section.label}
                    </TabsTrigger>
                  </Link>
                );
              })}
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="bg-background rounded-lg">
          {children}
        </div>
      </div>
    </div>
  );
}