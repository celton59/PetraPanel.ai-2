import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardActions } from "@/components/dashboard/DashboardActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { PerformanceStats } from "@/components/dashboard/PerformanceStats";
import { VideoStats } from "@/components/dashboard/VideoStats";
import { WeatherWidget } from "@/components/dashboard/WeatherWidget";
import { UsersList } from "@/components/dashboard/UsersList";
import { SuggestionsWidget } from "@/components/suggestions/SuggestionsWidget";
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
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Panel de Control
        </h1>
        <p className="text-muted-foreground mt-1">Resumen de estadísticas y actividad</p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-4 md:gap-6">
        {/* Action cards */}
        <motion.div variants={itemVariants}>
          <h3 className="text-xl font-semibold mb-4">Acciones rápidas</h3>
          <DashboardActions />
        </motion.div>

        {/* Stats cards */}
        <motion.div variants={itemVariants}>
          <DashboardStats />
        </motion.div>

        {/* Widgets grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div variants={itemVariants} className="lg:col-span-2 border border-muted/40 rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-4">Actividad reciente</h3>
            <RecentActivity />
          </motion.div>

          <motion.div variants={itemVariants} className="border border-muted/40 rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-4">Clima local</h3>
            <WeatherWidget />
          </motion.div>

          <motion.div variants={itemVariants} className="border border-muted/40 rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-4">Rendimiento</h3>
            <PerformanceStats />
          </motion.div>
          
          <motion.div variants={itemVariants} className="border border-muted/40 rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-4">Sugerencias</h3>
            <div className="py-2">
              <SuggestionsWidget />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="lg:col-span-2 border border-muted/40 rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-4">Métricas de videos</h3>
            <VideoStats />
          </motion.div>

          <motion.div variants={itemVariants} className="lg:col-span-3 border border-muted/40 rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-4">Equipo activo</h3>
            <UsersList />
          </motion.div>
        </motion.div>
      </motion.div>
      {/* Footer */}
      <motion.div
        variants={itemVariants}
        className="text-center text-sm text-muted-foreground mt-12 mb-4 opacity-80"
      >
        {/* La información de versión ahora se maneja desde VersionInfo.tsx */}
      </motion.div>
    </motion.div>
  );
};

export default Index;