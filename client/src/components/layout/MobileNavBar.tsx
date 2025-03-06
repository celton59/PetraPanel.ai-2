import { Bell, Home, Menu, Video, Languages, Leaf, Settings, Shield } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { LogoWithBlink } from "./LogoWithBlink";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

export function MobileNavBar() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { user } = useUser();
  const { unreadCount } = useNotifications();

  const isAdmin = user?.role === 'admin';

  // Un conjunto reducido de elementos de navegación para la barra inferior
  const navItems = [
    { icon: Home, label: "Inicio", path: "/" },
    { icon: Video, label: "Videos", path: "/videos" },
    { icon: Leaf, label: "Titulin", path: "/titulin" },
    // Botón de notificaciones con contador
    { 
      icon: Bell, 
      label: "Alertas", 
      path: "#notifications", 
      onClick: () => setIsNotificationsOpen(true),
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    // Solo mostrar menú completo para abrir el drawer
    { icon: Menu, label: "Menú", path: "#menu", onClick: () => setIsMenuOpen(true) }
  ];

  // Conjunto completo de elementos para el menú lateral
  const fullMenuItems = [
    { icon: Home, label: "Dashboard", path: "/" },
    { icon: Video, label: "Videos", path: "/videos" },
    { icon: Leaf, label: "Titulin", path: "/titulin" },
    { icon: Languages, label: "Traductor", path: "/traductor" },
    ...(isAdmin ? [
      { icon: Shield, label: "Administración", path: "/admin" }
    ] : []),
    { icon: Settings, label: "Configuración", path: "/profile" }
  ];

  const isActiveRoute = (path: string) => {
    if (path === '/') {
      return location === path;
    }
    if (path.startsWith('#')) return false;
    return location.startsWith(path);
  };

  return (
    <>
      {/* Barra de navegación fija en la parte inferior para móviles */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50 py-1 px-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = !item.path.startsWith('#') && isActiveRoute(item.path);
            
            if (item.path.startsWith('#')) {
              return (
                <Button
                  key={item.label}
                  variant="ghost"
                  size="sm"
                  onClick={item.onClick}
                  className="flex flex-col items-center justify-center px-1 py-2 rounded-lg w-16 relative"
                >
                  <item.icon className={cn(
                    "h-5 w-5 mb-1",
                    "text-muted-foreground"
                  )} />
                  {item.badge && (
                    <span className="absolute top-1 right-1 flex items-center justify-center min-w-5 h-5 text-xs 
                      font-bold text-white bg-red-500 rounded-full px-1">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                  <span className="text-xs font-medium text-muted-foreground">
                    {item.label}
                  </span>
                </Button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.path}
                className={cn(
                  "flex flex-col items-center justify-center px-1 py-2 rounded-lg w-16",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 mb-1",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-xs font-medium",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Menú lateral completo */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <div className="flex flex-col h-full">
            <div className="flex items-center p-4 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <LogoWithBlink iconSize={5} />
                <div className="flex flex-col">
                  <span className="font-bold text-sm bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    PetraPanel
                  </span>
                  <span className="text-[10px] -mt-0.5 text-muted-foreground/80">Video Studio</span>
                </div>
              </div>
            </div>
            <div className="flex-1 p-4">
              <nav className="flex flex-col gap-2">
                {fullMenuItems.map((item) => {
                  const isActive = isActiveRoute(item.path);
                  return (
                    <Link
                      key={item.label}
                      href={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
                        isActive
                          ? "bg-primary/10 dark:bg-primary/20 text-primary shadow-sm border-l-4 border-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:border-l-4 hover:border-primary/40"
                      )}
                    >
                      <item.icon className={cn(
                        "h-5 w-5 transition-transform",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        "text-sm transition-colors",
                        isActive ? "font-medium text-foreground" : "text-muted-foreground"
                      )}>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="p-4 border-t bg-muted/30 text-xs text-center text-muted-foreground">
              <p>PetraPanel v1.0</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Panel de notificaciones */}
      <Sheet open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
        <SheetContent side="right" className="w-[320px] sm:w-[380px] p-0">
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-lg">Notificaciones</h3>
              {unreadCount > 0 && (
                <div className="bg-primary/10 text-primary text-sm font-medium px-2 py-1 rounded-md">
                  {unreadCount} {unreadCount === 1 ? 'nueva' : 'nuevas'}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-auto">
              <NotificationCenter />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}