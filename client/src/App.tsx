import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import NotFound from "@/pages/not-found";
import Index from "@/pages/Index";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile/ProfilePage";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import VideosPage from "@/pages/videos/VideosPage";
import StatsPage from "@/pages/stats/StatsPage.new";
import VideoTranslator from "@/pages/VideoTranslator";
import { Toaster } from "sonner";
import { PageGuide } from "@/components/help/PageGuide";
import { GuideProvider } from "@/components/help/GuideContext";

// Importar las nuevas páginas de administrador
import AdminPage from "@/pages/admin/AdminPage";
import AdminStatsPage from "@/pages/admin/StatsPage";
import AccountingPage from "@/pages/admin/AccountingPage";
import ConfigurationPage from "@/pages/admin/ConfigurationPage";

// Ya no necesitamos un componente ProtectedRoute separado
// porque ahora incluimos el Layout directamente en cada ruta

function Router() {
  const { user, isLoading } = useUser();
  
  // Show loading spinner during initial load
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Si no hay usuario autenticado, mostrar AuthPage para cualquier ruta
  if (!user) {
    return <AuthPage />;
  }

  // Para usuarios autenticados
  return (
    <Switch>
      <Route path="/" component={() => <Layout><PageGuide /><Index /></Layout>} />
      <Route path="/perfil" component={() => <Layout><PageGuide /><ProfilePage /></Layout>} />
      <Route path="/videos" component={() => <Layout><PageGuide /><VideosPage /></Layout>} />
      <Route path="/traductor" component={() => <Layout><PageGuide /><VideoTranslator /></Layout>} />
      
      {/* Rutas de administración - solo accesibles para administradores */}
      {user.role === 'admin' && (
        <>
          <Route path="/admin" component={() => <Layout><PageGuide /><AdminPage /></Layout>} />
          <Route path="/admin/stats" component={() => <Layout><PageGuide /><AdminStatsPage /></Layout>} />
          <Route path="/admin/accounting" component={() => <Layout><PageGuide /><AccountingPage /></Layout>} />
          <Route path="/admin/configuration" component={() => <Layout><PageGuide /><ConfigurationPage /></Layout>} />
        </>
      )}
      
      {/* Ruta NotFound para capturar cualquier ruta no definida */}
      <Route component={() => <NotFound />} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GuideProvider>
        <Toaster 
          position="top-right"
          expand={false}
          closeButton
          richColors
          duration={3000}
        />
        <Router>
          {/* <Switch>
            <Route path="/*" component={Layout} />
          </Switch> */}
        </Router>
      </GuideProvider>
    </QueryClientProvider>
  );
}

export default App;