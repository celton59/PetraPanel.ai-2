import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import NotFound from "@/pages/not-found";
import Index from "@/pages/Index";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile/ProfilePage";
import SettingsPage from "@/pages/settings/SettingsPage";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import VideosPage from "@/pages/videos/VideosPage";
import StatsPage from "@/pages/stats/StatsPage";
import VideoTranslator from "@/pages/VideoTranslator";
import { Toaster } from "sonner";
import { PageGuide } from "@/components/help/PageGuide";
import { GuideProvider } from "@/components/help/GuideContext";
import TitulinPage from "./pages/titulin/TitulinPage";

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
      { user.role === 'admin' && <Route path="/ajustes" component={() => <ProtectedRoute component={SettingsPage} />} />}      
      <Route path="/videos" component={() => <ProtectedRoute component={VideosPage} />} />
      <Route path="/titulin" component={() => <ProtectedRoute component={TitulinPage} />} />
      <Route path="/estadisticas" component={() => <ProtectedRoute component={StatsPage} />} />
      <Route path="/traductor" component={() => <ProtectedRoute component={VideoTranslator} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GuideProvider>
        <Toaster expand />
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