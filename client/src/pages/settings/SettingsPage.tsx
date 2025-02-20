import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProjectsTab } from "./tabs/project/ProjectsTab";
import { UsersTab } from "./tabs/users/UsersTab";
import { RolesTab } from "@/components/settings/RolesTab";
import { VideoFlowTab } from "@/components/settings/VideoFlowTab";
import { useIsMobile } from "@/hooks/use-mobile";
import { Building2, Users2, Shield, GitBranch } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function SettingsPage () {
  const isMobile = useIsMobile();

  return (
    <div className="container mx-auto px-4 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona la configuración general de la plataforma
        </p>
      </div>

      <Tabs defaultValue="projects" className="space-y-4 md:space-y-0 md:flex md:gap-8">
        <div className="relative w-full md:w-auto">
          <Card className="sticky top-4 w-full md:w-auto p-3 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <ScrollArea className={`w-full ${isMobile ? 'overflow-x-auto' : ''}`}>
              <TabsList 
                className="h-full w-auto flex flex-col space-y-1 bg-transparent min-w-[200px]"
              >
                <TabsTrigger 
                  value="projects" 
                  className="w-full justify-start px-3 py-2 gap-2.5 data-[state=active]:bg-primary/10 hover:bg-muted/80 transition-colors rounded-md"
                >
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Proyectos</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="users" 
                  className="w-full justify-start px-3 py-2 gap-2.5 data-[state=active]:bg-primary/10 hover:bg-muted/80 transition-colors rounded-md"
                >
                  <Users2 className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Usuarios</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="roles" 
                  className="w-full justify-start px-3 py-2 gap-2.5 data-[state=active]:bg-primary/10 hover:bg-muted/80 transition-colors rounded-md"
                >
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Roles</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="workflow" 
                  className="w-full justify-start px-3 py-2 gap-2.5 data-[state=active]:bg-primary/10 hover:bg-muted/80 transition-colors rounded-md"
                >
                  <GitBranch className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Flujo de trabajo</span>
                </TabsTrigger>
              </TabsList>
            </ScrollArea>
          </Card>
        </div>

        <div className="flex-1">
          <TabsContent value="projects" className="space-y-4 mt-2 md:mt-0">
            <ProjectsTab />
          </TabsContent>

          <TabsContent value="users" className="space-y-4 mt-2 md:mt-0">
            <UsersTab />
          </TabsContent>

          <TabsContent value="roles" className="space-y-4 mt-2 md:mt-0">
            <RolesTab />
          </TabsContent>

          <TabsContent value="workflow" className="space-y-4 mt-2 md:mt-0">
            <VideoFlowTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
