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
import TrashPage from "@/pages/videos/TrashPage";
import VideoTranslator from "@/pages/VideoTranslator";
import { Toaster } from "sonner";
import { PageGuide } from "@/components/help/PageGuide";
import { GuideProvider } from "@/components/help/GuideContext";
import TitulinPage from "./pages/titulin/TitulinPage";

// Importar las nuevas páginas de administrador
import AdminPage from "@/pages/admin/AdminPage";
import AdminStatsPage from "@/pages/admin/StatsPage";
import AccountingPage from "@/pages/admin/accounting/AccountingPage";
import ConfigurationPage from "@/pages/admin/configuration/ConfigurationPage";
import NotificationsAdminPage from "@/pages/admin/notifications/NotificationsAdminPage";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <Layout>
      <PageGuide />
      <Component />
    </Layout>
  );
}

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

  // If no user, show AuthPage regardless of route
  if (!user) {
    return <AuthPage />;
  }

  // Authenticated user
  return (
    <Switch>
      <Route path="/" component={() => <ProtectedRoute component={Index} />} />
      <Route path="/perfil" component={() => <ProtectedRoute component={ProfilePage} />} />
      <Route path="/videos" component={() => <ProtectedRoute component={VideosPage} />} />
      <Route path="/videos/trash" component={() => <ProtectedRoute component={TrashPage} />} />
      <Route path="/titulin" component={() => <ProtectedRoute component={TitulinPage} />} />
      <Route path="/traductor" component={() => <ProtectedRoute component={VideoTranslator} />} />
      
      {/* Rutas de administración - solo accesibles para administradores */}
      { user.role === 'admin' && (
        <>
          <Route path="/admin" component={() => <ProtectedRoute component={AdminPage} />} />
          <Route path="/admin/stats" component={() => <ProtectedRoute component={AdminStatsPage} />} />
          <Route path="/admin/accounting" component={() => <ProtectedRoute component={AccountingPage} />} />
          <Route path="/admin/configuration" component={() => <ProtectedRoute component={ConfigurationPage} />} />
          <Route path="/admin/notifications" component={() => <ProtectedRoute component={NotificationsAdminPage} />} />
        </>
      )}
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GuideProvider>
        <Toaster 
          position="bottom-center"
          expand={false}
          closeButton={false}
          richColors
          duration={1500}
          offset={16}
          toastOptions={{
            style: { 
              fontSize: '0.85rem', 
              padding: '6px 12px',
              maxWidth: '320px'
            },
            className: 'compact-toast'
          }}
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