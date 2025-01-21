import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardActions } from "@/components/dashboard/DashboardActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { PerformanceStats } from "@/components/dashboard/PerformanceStats";
import { VideoStats } from "@/components/dashboard/VideoStats";
import { WeatherWidget } from "@/components/dashboard/WeatherWidget";
import { UsersList } from "@/components/dashboard/UsersList";
import { useUser } from "@/hooks/use-user";

const Index = () => {
  const { user } = useUser();

  if (!user) return null;

  return (
    <div className="space-y-6 sm:space-y-8 md:space-y-10 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center mb-4 sm:mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Panel de Control</h1>
          <p className="text-muted-foreground mt-1">Resumen de estadísticas y actividad</p>
        </div>
      </div>

      <div className="grid gap-4 md:gap-6">
        <DashboardActions />
        <DashboardStats />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentActivity />
          </div>
          <div>
            <WeatherWidget />
          </div>
          <div>
            <PerformanceStats />
          </div>
          <div className="lg:col-span-2">
            <VideoStats />
          </div>
          <div className="lg:col-span-3">
            <UsersList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;