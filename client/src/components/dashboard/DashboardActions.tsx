import { Video, Target, Youtube, Rocket } from "lucide-react";
import ActionCard from "@/components/ActionCard";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";

export const DashboardActions = () => {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  
  // Solo mostrar la opción de "Nuevo Video" para administradores
  const userActions = [
    // Acción condicional para "Nuevo Video" - solo para admins
    ...(user?.role === "admin" ? [{
      icon: Video,
      title: "Nuevo Video",
      description: "Crear y subir un nuevo video",
      iconColor: "text-blue-500",
      iconBgColor: "bg-blue-500/10",
      onClick: () => setLocation('/videos')
    }] : []),
    
    {
      icon: Target,
      title: "Optimizar SEO",
      description: "Mejorar el posicionamiento",
      iconColor: "text-green-500",
      iconBgColor: "bg-green-500/10",
      onClick: () => setLocation('/videos')
    },
    {
      icon: Youtube,
      title: "Gestionar Canal",
      description: "Administrar YouTube",
      iconColor: "text-red-500",
      iconBgColor: "bg-red-500/10",
      onClick: () => setLocation('/videos')
    },
    {
      icon: Rocket,
      title: "Sugerir Video",
      description: "Nueva idea de contenido",
      iconColor: "text-purple-500",
      iconBgColor: "bg-purple-500/10",
      onClick: () => setLocation('/videos')
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 p-1">
      {userActions.map((action) => (
        <ActionCard 
          key={action.title} 
          {...action}
          className="transform hover:scale-105 transition-all duration-200"
        />
      ))}
    </div>
  );
};