import { BarChart, Home, Languages, Menu, Settings, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    { icon: BarChart, label: "Estadísticas", path: "/estadisticas", tooltip: "Métricas y análisis" },
    ...(isAdmin ? [{ icon: Settings, label: "Configuración", path: "/ajustes", tooltip: "Configuración del sistema" }] : []),
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
          <div className="relative h-9 w-9 flex items-center justify-center bg-primary rounded-md shadow-sm overflow-hidden">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
              <path d="M12 4.80005C12.5333 4.80005 13.0333 4.93338 13.5 5.20005C13.9667 5.46672 14.3333 5.80005 14.6 6.20005C14.8667 6.60005 15 7.06671 15 7.60005C15 8.13338 14.8667 8.60005 14.6 9.00005C14.3333 9.40005 13.9667 9.73338 13.5 10C13.0333 10.2667 12.5333 10.4 12 10.4C11.4667 10.4 10.9667 10.2667 10.5 10C10.0333 9.73338 9.66667 9.40005 9.4 9.00005C9.13333 8.60005 9 8.13338 9 7.60005C9 7.06671 9.13333 6.60005 9.4 6.20005C9.66667 5.80005 10.0333 5.46672 10.5 5.20005C10.9667 4.93338 11.4667 4.80005 12 4.80005ZM4 19.2V17.6C4 17.0667 4.15 16.6 4.45 16.2C4.75 15.8 5.13333 15.5334 5.6 15.4C6.6 15.1334 7.5 14.9334 8.3 14.8C9.1 14.6667 9.9 14.6 10.7 14.6H13.3C14.1 14.6 14.9 14.6667 15.7 14.8C16.5 14.9334 17.4 15.1334 18.4 15.4C18.8667 15.5334 19.25 15.8 19.55 16.2C19.85 16.6 20 17.0667 20 17.6V19.2H4Z" fill="white"/>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base leading-tight">
              PetraPanel
            </span>
            <span className="text-[10px] text-muted-foreground">Video Studio</span>
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
                    <div className="relative h-9 w-9 flex items-center justify-center bg-primary rounded-md shadow-sm overflow-hidden">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                        <path d="M12 4.80005C12.5333 4.80005 13.0333 4.93338 13.5 5.20005C13.9667 5.46672 14.3333 5.80005 14.6 6.20005C14.8667 6.60005 15 7.06671 15 7.60005C15 8.13338 14.8667 8.60005 14.6 9.00005C14.3333 9.40005 13.9667 9.73338 13.5 10C13.0333 10.2667 12.5333 10.4 12 10.4C11.4667 10.4 10.9667 10.2667 10.5 10C10.0333 9.73338 9.66667 9.40005 9.4 9.00005C9.13333 8.60005 9 8.13338 9 7.60005C9 7.06671 9.13333 6.60005 9.4 6.20005C9.66667 5.80005 10.0333 5.46672 10.5 5.20005C10.9667 4.93338 11.4667 4.80005 12 4.80005ZM4 19.2V17.6C4 17.0667 4.15 16.6 4.45 16.2C4.75 15.8 5.13333 15.5334 5.6 15.4C6.6 15.1334 7.5 14.9334 8.3 14.8C9.1 14.6667 9.9 14.6 10.7 14.6H13.3C14.1 14.6 14.9 14.6667 15.7 14.8C16.5 14.9334 17.4 15.1334 18.4 15.4C18.8667 15.5334 19.25 15.8 19.55 16.2C19.85 16.6 20 17.0667 20 17.6V19.2H4Z" fill="white"/>
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-base leading-tight">
                        PetraPanel
                      </span>
                      <span className="text-[10px] text-muted-foreground">Video Studio</span>
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