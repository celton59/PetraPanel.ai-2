import { Video, Target, Youtube, Rocket } from "lucide-react";
import ActionCard from "@/components/ActionCard";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { User } from "@db/schema";

// Define el tipo para una acción
interface ActionItem {
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  iconColor: string;
  iconBgColor: string;
  onClick: () => void;
  requiredRole?: User["role"];
}

export const DashboardActions = () => {
  const [, setLocation] = useLocation();
  const { user } = useUser();

  // Definimos todas las acciones posibles
  const allActions: ActionItem[] = [
    {
      icon: Video,
      title: "Nuevo Video",
      description: "Crear y subir un nuevo video",
      iconColor: "text-blue-500",
      iconBgColor: "bg-blue-500/10",
      onClick: () => setLocation('/videos?new=true'),
      requiredRole: "admin" // Solo admin puede ver esta acción
    },
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
      onClick: () => setLocation('/videos?new=true')
    },
  ];

  // Filtrar acciones basadas en el rol del usuario
  const actions = allActions.filter(action => {
    // Si la acción no requiere un rol específico, mostrarla para todos
    if (!action.requiredRole) return true;
    
    // Si la acción requiere un rol específico, verificar si el usuario tiene ese rol
    return user?.role === action.requiredRole;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 p-1">
      {actions.map((action) => (
        <ActionCard 
          key={action.title} 
          {...action}
          className="transform hover:scale-105 transition-all duration-200"
        />
      ))}
    </div>
  );
};