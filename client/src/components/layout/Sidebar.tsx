import { Home, Languages, Leaf, Video, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LogoWithBlink } from "./LogoWithBlink";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useUser()

  const isAdmin = user?.role === 'admin';

  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/", tooltip: "Panel principal" },
    { icon: Video, label: "Videos", path: "/videos", tooltip: "Gestión de videos" },
    // Solo mostrar Titulin si es admin
    ...(isAdmin ? [
      { icon: Leaf, label: "Titulin", path: "/titulin", tooltip: "Análisis de contenido" }
    ] : []),
    { icon: Languages, label: "Traductor", path: "/traductor", tooltip: "Traductor de videos" },
    ...(isAdmin ? [
      { icon: Shield, label: "Administración", path: "/admin", tooltip: "Panel de administración" }
    ] : []),
  ];

  const isActiveRoute = (path: string) => {
    if (path === '/') {
      return location === path;
    }
    return location.startsWith(path);
  };

  return (
    <div className={cn(
      "flex-1 border-b md:border-b-0",
      className
    )}>
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Logo - visible en todos los dispositivos */}
        <Link 
          href="/" 
          className="flex items-center gap-2 hover:opacity-80 transition-all"
        >
          <LogoWithBlink iconSize={5} />
          <div className="flex flex-col">
            <span className="font-bold text-sm bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              PetraPanel
            </span>
            <span className="text-[10px] -mt-0.5 text-muted-foreground/80">Video Studio</span>
          </div>
        </Link>

        {/* Navegación horizontal para escritorio */}
        <div className="hidden md:block">
          <nav className="flex items-center gap-2">
            {menuItems.map((item) => {
              const isActive = isActiveRoute(item.path);
              const NavLink = (
                <Link
                  key={item.label}
                  href={item.path}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary/10 dark:bg-primary/20 text-primary shadow-sm border-b-4 border-primary pb-[6px] rounded-none"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:border-b-4 hover:border-primary/40 hover:rounded-none hover:pb-[6px]"
                  )}
                >
                  <item.icon className={cn(
                    "h-4 w-4 transition-transform",
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

              return (
                <TooltipProvider key={item.path}>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      {NavLink}
                    </TooltipTrigger>
                    {item.tooltip && (
                      <TooltipContent side="bottom">
                        <p>{item.tooltip}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}