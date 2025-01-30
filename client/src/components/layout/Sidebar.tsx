import { BarChart, Home, Menu, Settings, Video, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Simulated profile data
  const profile = {
    role: 'admin'
  };

  const isAdmin = profile?.role === 'admin';

  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/" },
    { icon: Video, label: "Videos", path: "/videos" },
    { icon: Languages, label: "Traductor", path: "/traductor" },
    { icon: BarChart, label: "Estadísticas", path: "/estadisticas" },
    ...(isAdmin ? [{ icon: Settings, label: "Configuración", path: "/ajustes" }] : []),
  ];

  const isActiveRoute = (path: string) => {
    if (path === '/') {
      return location === path;
    }
    return location.startsWith(path);
  };

  const NavLinks = () => (
    <nav className="flex md:items-center gap-1.5 flex-col md:flex-row">
      {menuItems.map((item) => (
        <Link
          key={item.label}
          href={item.path}
          onClick={() => setIsOpen(false)}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 md:py-1.5 text-sm font-medium transition-colors w-full md:w-auto",
            isActiveRoute(item.path)
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <item.icon className="h-4 w-4" />
          <span className="text-sm">{item.label}</span>
        </Link>
      ))}
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
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="relative h-7 w-7 flex items-center justify-center">
            <Video className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold text-sm">PetraPanel</span>
        </Link>

        {/* Desktop version */}
        <div className="hidden md:block">
          <NavLinks />
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
            <SheetContent side="left" className="w-[240px] p-0">
              <div className="flex flex-col h-full">
                <div className="flex items-center p-4 border-b">
                  <div className="flex items-center gap-2">
                    <div className="relative h-7 w-7 flex items-center justify-center">
                      <Video className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-bold text-sm">PetraPanel</span>
                  </div>
                </div>
                <div className="flex-1 p-4">
                  <NavLinks />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}