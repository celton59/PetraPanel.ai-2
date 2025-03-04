import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useState } from "react";
import { UsersTab } from "@/pages/settings/tabs/users/UsersTab";
import { RolesTab } from "@/pages/settings/tabs/roles/RolesTab";
import { ProjectsTab } from "@/pages/settings/tabs/project/ProjectsTab";
import { VideoFlowTab } from "@/pages/settings/tabs/workflow/VideoFlowTab";
import { RatesTab } from "@/pages/settings/tabs/accounting/RatesTab";
import { FinanceConfigTab } from "@/pages/settings/tabs/accounting/FinanceConfigTab";
import { Card, CardContent } from "@/components/ui/card";
import { 
  User, 
  Briefcase, 
  Users, 
  Workflow, 
  DollarSign, 
  Building 
} from "lucide-react";

/**
 * Página de configuración del administrador que contiene diferentes pestañas
 * para gestionar configuraciones del sistema.
 */
export default function ConfigurationPage() {
  const [activeTab, setActiveTab] = useState("usuarios");
  
  const tabConfig = [
    { id: "usuarios", label: "Usuarios", icon: User },
    { id: "proyectos", label: "Proyectos", icon: Briefcase },
    { id: "roles", label: "Roles", icon: Users },
    { id: "workflow", label: "Flujo de trabajo", icon: Workflow },
    { id: "tarifas", label: "Tarifas", icon: DollarSign },
    { id: "finanzas", label: "Config. Financiera", icon: Building },
  ];
  
  return (
    <AdminLayout>
      <div className="w-full space-y-6">
        <div className="flex flex-col space-y-1.5 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground">
            Gestiona la configuración global del sistema, usuarios, proyectos y flujos de trabajo.
          </p>
        </div>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-8">
                {tabConfig.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger 
                      key={tab.id}
                      value={tab.id}
                      className="flex items-center gap-2 py-2.5"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              
              <TabsContent value="usuarios" className="space-y-4 mt-0">
                <UsersTab />
              </TabsContent>
              
              <TabsContent value="proyectos" className="space-y-4 mt-0">
                <ProjectsTab />
              </TabsContent>
              
              <TabsContent value="roles" className="space-y-4 mt-0">
                <RolesTab />
              </TabsContent>
              
              <TabsContent value="workflow" className="space-y-4 mt-0">
                <VideoFlowTab />
              </TabsContent>
              
              <TabsContent value="tarifas" className="space-y-4 mt-0">
                <RatesTab />
              </TabsContent>
              
              <TabsContent value="finanzas" className="space-y-4 mt-0">
                <FinanceConfigTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}