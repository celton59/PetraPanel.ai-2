import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Index from "@/pages/Index";
import AuthPage from "@/pages/auth-page";
import Profile from "@/pages/Profile";
import Settings from "@/pages/settings/Settings";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import Videos from "@/pages/Videos";
import StatsPage from "@/pages/StatsPage";
import VideoTranslator from "@/pages/VideoTranslator";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <Layout>
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
      <Route path="/perfil" component={() => <ProtectedRoute component={Profile} />} />
      <Route path="/ajustes" component={() => <ProtectedRoute component={Settings} />} />
      <Route path="/videos" component={() => <ProtectedRoute component={Videos} />} />
      <Route path="/estadisticas" component={() => <ProtectedRoute component={StatsPage} />} />
      <Route path="/traductor" component={() => <ProtectedRoute component={VideoTranslator} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Switch>
          <Route path="/*" component={Layout} />
        </Switch>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;