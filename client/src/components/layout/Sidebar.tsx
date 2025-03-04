import { BarChart, Home, Languages, Menu, Settings, Video, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AnimatedLogo } from "./AnimatedLogo";
import { LogoWithBlink } from "./LogoWithBlink";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser()

  const isAdmin = user?.role === 'admin';

  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/", tooltip: "Panel principal" },
    { icon: Video, label: "Videos", path: "/videos", tooltip: "Gestión de videos" },
    { icon: Languages, label: "Traductor", path: "/traductor", tooltip: "Traductor de videos" },
    ...(isAdmin ? [
      { icon: Shield, label: "Administración", path: "/admin", tooltip: "Panel de administración" },
      { icon: BarChart, label: "Estadísticas", path: "/admin/stats", tooltip: "Métricas y análisis" },
      { icon: Settings, label: "Configuración", path: "/admin/settings", tooltip: "Configuración del sistema" }
    ] : []),
  ];

  const isActiveRoute = (path: string) => {
    if (path === '/') {
      return location === path;
    }
    return location.startsWith(path);
  };

  // Navigation Links with optional tooltips for desktop
  const NavLinks = ({ showTooltips = false }: { showTooltips?: boolean }) => (
    <nav className="flex md:items-center gap-2 flex-col md:flex-row">
      {menuItems.map((item) => {
        const isActive = isActiveRoute(item.path);
        const NavLink = (
          <Link
            key={item.label}
            href={item.path}
            onClick={() => setIsOpen(false)}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 md:py-1.5 text-sm font-medium transition-all w-full md:w-auto",
              isActive
                ? "bg-primary/10 dark:bg-primary/20 text-primary shadow-sm border-l-4 border-primary md:border-l-0 md:border-b-4 md:pb-[6px] md:rounded-none md:px-3"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:border-l-4 hover:border-primary/40 md:hover:border-l-0 md:hover:border-b-4 md:hover:rounded-none md:hover:pb-[6px]"
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

        // Wrap in tooltip if needed
        if (showTooltips) {
          return (
            <TooltipProvider key={item.path}>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  {NavLink}
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{item.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        return NavLink;
      })}
    </nav>
  );

  return (
    <div className={cn(
      "flex-1 border-b md:border-b-0",
      className
    )}>
      <div className="flex h-14 items-center px-4 gap-4">
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

        {/* Desktop version */}
        <div className="hidden md:block">
          <NavLinks showTooltips={true} />
        </div>

        {/* Mobile menu */}
        <div className="md:hidden ml-auto">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 border rounded-md hover:bg-accent"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
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
                  <NavLinks />
                </div>
                <div className="p-4 border-t bg-muted/30 text-xs text-center text-muted-foreground">
                  <p>PetraPanel v1.0</p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}