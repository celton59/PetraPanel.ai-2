
import { Clock, Users, Video, CheckCircle } from "lucide-react";
import StatsCard from "@/components/StatsCard";
import { useVideos } from "@/hooks/useVideos";
import { useUsers } from "@/hooks/useUsers";

export const DashboardStats = () => {
  const { videos } = useVideos();
  const { users } = useUsers();

  const totalVideos = videos?.length || 0;
  const availableVideos = videos?.filter(v => v.status === 'available').length || 0;
  const completedVideos = videos?.filter(v => v.status === 'completed').length || 0;
  const inProgressVideos = totalVideos - completedVideos - availableVideos;
  
  const activeUsers = users?.filter(u => u.lastLoginAt && new Date(u.lastLoginAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length || 0;

  const statsCards = [
    {
      title: "Total Videos",
      value: totalVideos.toString(),
      change: `${availableVideos} pendientes`,
      isPositive: true,
      icon: Video,
      animation: {
        rotate: [0, 10, -10, 0],
        transition: { repeat: Infinity, duration: 2 }
      }
    },
    {
      title: "Videos Completados",
      value: completedVideos.toString(),
      change: `${Math.round((completedVideos/totalVideos || 0) * 100)}% del total`,
      isPositive: true,
      icon: CheckCircle,
      animation: {
        scale: [1, 1.2, 1],
        transition: { repeat: Infinity, duration: 1.5 }
      }
    },
    {
      title: "En Proceso",
      value: inProgressVideos.toString(),
      change: `${inProgressVideos} en producción`,
      isPositive: true,
      icon: Clock,
      animation: {
        rotate: [0, 360],
        transition: { repeat: Infinity, duration: 8, ease: "linear" }
      }
    },
    {
      title: "Usuarios Activos",
      value: activeUsers.toString(),
      change: "Últimos 7 días",
      isPositive: true,
      icon: Users,
      animation: {
        y: [0, -5, 0],
        transition: { repeat: Infinity, duration: 2 }
      }
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
      {statsCards.map((stat) => (
        <StatsCard key={stat.title} {...stat} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1" />
      ))}
    </div>
  );
};
