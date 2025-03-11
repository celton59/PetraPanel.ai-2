import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/use-user";
import { ProfileHeader } from "./components/ProfileHeader";
import { PersonalInfoSection } from "./components/PersonalInfoSection";
import { PasswordSection } from "./components/PasswordSection";
import { NotificationsSection } from "./components/NotificationsSection";
import { ActivitySection } from "./components/ActivitySection";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";

export default function ProfilePage() {
  const { user, refetch } = useUser();

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Gestiona tu información personal y preferencias
        </p>
      </div>

      <ProfileHeader user={user} refetch={refetch} />

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
          <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
          <TabsTrigger value="actividad">Actividad</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6">
          <PersonalInfoSection user={user} refetch={refetch} />
        </TabsContent>
        
        <TabsContent value="seguridad" className="mt-6">
          <PasswordSection />
        </TabsContent>
        
        <TabsContent value="notificaciones" className="mt-6">
          <NotificationsSection />
        </TabsContent>
        
        <TabsContent value="actividad" className="mt-6">
          <ActivitySection />
        </TabsContent>
      </Tabs>
    </div>
  );
}