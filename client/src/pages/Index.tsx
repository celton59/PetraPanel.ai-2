import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardActions } from "@/components/dashboard/DashboardActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { PerformanceStats } from "@/components/dashboard/PerformanceStats";
import { VideoStats } from "@/components/dashboard/VideoStats";
import { WeatherWidget } from "@/components/dashboard/WeatherWidget";
import { UsersList } from "@/components/dashboard/UsersList";
import { useUser } from "@/hooks/use-user";
import { motion } from "framer-motion";

const Index = () => {
  const { user } = useUser();

  if (!user) return null;
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 80 }
    }
  };

  return (
    <motion.div 
      className="space-y-6 sm:space-y-8 md:space-y-10 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="mb-4 sm:mb-6 md:mb-8">
        <div className="relative">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Panel de Control
          </h1>
          <div className="absolute -bottom-1 left-0 h-1 w-24 bg-gradient-to-r from-primary/50 to-transparent rounded-full"></div>
          <p className="text-muted-foreground mt-2">Resumen de estadísticas y actividad</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-4 md:gap-6">
        {/* Action cards */}
        <motion.div 
          variants={itemVariants}
          className="rounded-xl border border-muted/60 bg-gradient-to-br from-background to-primary/5 p-4 md:p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-xl font-semibold">Acciones rápidas</h3>
            <div className="h-0.5 flex-1 bg-gradient-to-r from-muted-foreground/20 to-transparent rounded-full"></div>
          </div>
          <DashboardActions />
        </motion.div>
        
        {/* Stats cards */}
        <motion.div variants={itemVariants}>
          <DashboardStats />
        </motion.div>
        
        {/* Widgets grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-2 border border-muted/60 rounded-xl bg-gradient-to-br from-background to-primary/5 p-4 md:p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-xl font-semibold">Actividad reciente</h3>
              <div className="h-0.5 flex-1 bg-gradient-to-r from-muted-foreground/20 to-transparent rounded-full"></div>
              <span className="text-sm px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full">
                Últimas 24h
              </span>
            </div>
            <RecentActivity />
          </motion.div>
          
          <motion.div 
            variants={itemVariants}
            className="border border-muted/60 rounded-xl bg-gradient-to-br from-background to-primary/5 p-4 md:p-6"
          >
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-1">Clima local</h3>
              <div className="h-0.5 w-16 bg-primary/30 rounded-full"></div>
            </div>
            <WeatherWidget />
          </motion.div>
          
          <motion.div 
            variants={itemVariants}
            className="border border-muted/60 rounded-xl bg-gradient-to-br from-background to-primary/5 p-4 md:p-6"
          >
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-1">Rendimiento</h3>
              <div className="h-0.5 w-16 bg-primary/30 rounded-full"></div>
            </div>
            <PerformanceStats />
          </motion.div>
          
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-2 border border-muted/60 rounded-xl bg-gradient-to-br from-background to-primary/5 p-4 md:p-6"
          >
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-1">Métricas de videos</h3>
              <div className="h-0.5 w-16 bg-primary/30 rounded-full"></div>
            </div>
            <VideoStats />
          </motion.div>
          
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-3 border border-muted/60 rounded-xl bg-gradient-to-br from-background to-primary/5 p-4 md:p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-xl font-semibold">Equipo activo</h3>
              <div className="h-0.5 flex-1 bg-gradient-to-r from-muted-foreground/20 to-transparent rounded-full"></div>
            </div>
            <UsersList />
          </motion.div>
        </motion.div>
      </motion.div>
      
      {/* Footer */}
      <motion.div
        variants={itemVariants}
        className="text-center text-sm text-muted-foreground mt-12 mb-4 opacity-80"
      >
        PetraPanel v2.5.0 • Actualizado: 01.03.2025
      </motion.div>
    </motion.div>
  );
};

export default Index;