import { Bell, Home, Menu, Video, Languages, Leaf, Settings, Shield, Users } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useRef, useEffect } from "react";
import { LogoWithBlink } from "./LogoWithBlink";
import { useNotifications } from "@/hooks/use-notifications";
import { MobileNotificationCenter } from "@/components/notifications/MobileNotificationCenter";
import { OnlineUsersIndicator } from "../users/OnlineUsersIndicator";
import { useOnlineUsers } from "@/hooks/use-online-users";
import { useSwipeable } from "react-swipeable";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowRightFromLine, ArrowLeftFromLine } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function MobileNavBar() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showSwipeHelp, setShowSwipeHelp] = useState(false);
  const { user } = useUser();
  const { unreadCount } = useNotifications();
  const { onlineUsers } = useOnlineUsers();
  const isMobile = useIsMobile();

  const isAdmin = user?.role === 'admin';
  
  // Mostrar ayuda de gestos solo en la primera sesión del usuario
  useEffect(() => {
    // Verificar si es la primera vez que el usuario accede
    const hasSeenSwipeHelp = localStorage.getItem('hasSeenSwipeHelp');
    
    if (isMobile && !hasSeenSwipeHelp) {
      // Mostrar la ayuda después de un breve retraso
      setTimeout(() => {
        setShowSwipeHelp(true);
        
        // Ocultar después de 5 segundos
        setTimeout(() => {
          setShowSwipeHelp(false);
          localStorage.setItem('hasSeenSwipeHelp', 'true');
        }, 5000);
      }, 1000);
    }
  }, [isMobile]);

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

  // Configurar los manejadores de gestos táctiles
  const swipeHandlers = useSwipeable({
    onSwipedRight: () => {
      if (isMobile && !isMenuOpen) {
        setIsMenuOpen(true);
      }
    },
    onSwipedLeft: () => {
      if (isMobile && !isNotificationsOpen) {
        setIsNotificationsOpen(true);
      }
    },
    // Configuración para hacer que los gestos sean más responsivos
    trackMouse: false,
    trackTouch: true,
    delta: 10,       // Cantidad mínima de movimiento para considerar un swipe
    rotationAngle: 0
  });

  return (
    <>
      {/* Áreas para detectar los gestos táctiles en los bordes laterales */}
      {isMobile && (
        <>
          {/* Área para detectar swipe desde el borde izquierdo con indicador mejorado y estilizado */}
          <div 
            {...swipeHandlers}
            className="md:hidden fixed top-0 bottom-0 left-0 w-12 z-20"
            aria-hidden="true"
          >
            {/* Indicador principal elegante con efecto de resplandor */}
            <div className="absolute inset-y-0 left-0 flex flex-col justify-center items-start">
              <motion.div 
                className="relative w-1.5 h-[45%] overflow-hidden rounded-r-xl bg-gradient-to-b from-primary/10 via-primary/60 to-primary/10 border-r-[0.5px] border-primary/30"
                animate={{ 
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {/* Efecto de resplandor interno */}
                <motion.div 
                  className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent to-white/20"
                  animate={{ 
                    x: ['-100%', '100%', '-100%']
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
              
              {/* Indicador de dirección sutil */}
              <div className="absolute left-2 inset-y-0 flex flex-col justify-center space-y-1">
                <motion.div
                  className="w-1 h-1 rounded-full bg-primary/40"
                  animate={{ x: [0, 2, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", delay: 1 }}
                />
              </div>
            </div>
            
            {/* Indicadores de puntos animados con efecto de brillo mejorado */}
            <div className="absolute inset-y-0 left-2 flex flex-col justify-center items-start gap-8">
              {/* Primer punto con efecto de arrastre */}
              <div className="relative">
                <motion.div 
                  className="relative z-10 w-2 h-2 rounded-full bg-gradient-to-r from-primary/70 to-primary/90 shadow-[0_0_5px_rgba(var(--primary),0.5)]"
                  animate={{ 
                    x: [0, 4, 0],
                    opacity: [0.5, 0.9, 0.5],
                    scale: [0.85, 1.05, 0.85]
                  }}
                  transition={{ duration: 2.2, delay: 0.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  {/* Efecto de brillo interior */}
                  <motion.div 
                    className="absolute inset-0 rounded-full bg-white/40"
                    animate={{ opacity: [0, 0.5, 0] }}
                    transition={{ duration: 1.5, delay: 0.7, repeat: Infinity }}
                  />
                </motion.div>
                {/* Estela del punto */}
                <motion.div 
                  className="absolute top-0 left-0 w-2 h-2 rounded-full bg-primary/30 blur-[1px]"
                  animate={{ 
                    x: [-2, 2, -2],
                    opacity: [0, 0.7, 0]
                  }}
                  transition={{ duration: 2.2, delay: 0.6, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              
              {/* Segundo punto con efecto de arrastre */}
              <div className="relative">
                <motion.div 
                  className="relative z-10 w-2 h-2 rounded-full bg-gradient-to-r from-primary/70 to-primary/90 shadow-[0_0_5px_rgba(var(--primary),0.5)]"
                  animate={{ 
                    x: [0, 4, 0],
                    opacity: [0.5, 0.9, 0.5],
                    scale: [0.85, 1.05, 0.85]
                  }}
                  transition={{ duration: 2.2, delay: 1.3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <motion.div 
                    className="absolute inset-0 rounded-full bg-white/40"
                    animate={{ opacity: [0, 0.5, 0] }}
                    transition={{ duration: 1.5, delay: 1.5, repeat: Infinity }}
                  />
                </motion.div>
                <motion.div 
                  className="absolute top-0 left-0 w-2 h-2 rounded-full bg-primary/30 blur-[1px]"
                  animate={{ 
                    x: [-2, 2, -2],
                    opacity: [0, 0.7, 0]
                  }}
                  transition={{ duration: 2.2, delay: 1.4, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              
              {/* Tercer punto con efecto de arrastre */}
              <div className="relative">
                <motion.div 
                  className="relative z-10 w-2 h-2 rounded-full bg-gradient-to-r from-primary/70 to-primary/90 shadow-[0_0_5px_rgba(var(--primary),0.5)]"
                  animate={{ 
                    x: [0, 4, 0],
                    opacity: [0.5, 0.9, 0.5],
                    scale: [0.85, 1.05, 0.85]
                  }}
                  transition={{ duration: 2.2, delay: 2.1, repeat: Infinity, ease: "easeInOut" }}
                >
                  <motion.div 
                    className="absolute inset-0 rounded-full bg-white/40"
                    animate={{ opacity: [0, 0.5, 0] }}
                    transition={{ duration: 1.5, delay: 2.3, repeat: Infinity }}
                  />
                </motion.div>
                <motion.div 
                  className="absolute top-0 left-0 w-2 h-2 rounded-full bg-primary/30 blur-[1px]"
                  animate={{ 
                    x: [-2, 2, -2],
                    opacity: [0, 0.7, 0]
                  }}
                  transition={{ duration: 2.2, delay: 2.2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </div>
          </div>
          
          {/* Área para detectar swipe desde el borde derecho con indicador mejorado y estilizado */}
          <div 
            {...swipeHandlers}
            className="md:hidden fixed top-0 bottom-0 right-0 w-12 z-20"
            aria-hidden="true"
          >
            {/* Indicador principal elegante con efecto de resplandor */}
            <div className="absolute inset-y-0 right-0 flex flex-col justify-center items-end">
              <motion.div 
                className="relative w-1.5 h-[45%] overflow-hidden rounded-l-xl bg-gradient-to-b from-primary/10 via-primary/60 to-primary/10 border-l-[0.5px] border-primary/30"
                animate={{ 
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {/* Efecto de resplandor interno */}
                <motion.div 
                  className="absolute inset-0 w-full h-full bg-gradient-to-l from-transparent to-white/20"
                  animate={{ 
                    x: ['100%', '-100%', '100%']
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
              
              {/* Indicador de dirección sutil */}
              <div className="absolute right-2 inset-y-0 flex flex-col justify-center space-y-1">
                <motion.div
                  className="w-1 h-1 rounded-full bg-primary/40"
                  animate={{ x: [0, -2, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", delay: 1 }}
                />
              </div>
            </div>
            
            {/* Indicadores de puntos animados con efecto de brillo mejorado */}
            <div className="absolute inset-y-0 right-2 flex flex-col justify-center items-end gap-8">
              {/* Primer punto con efecto de arrastre */}
              <div className="relative">
                <motion.div 
                  className="relative z-10 w-2 h-2 rounded-full bg-gradient-to-l from-primary/70 to-primary/90 shadow-[0_0_5px_rgba(var(--primary),0.5)]"
                  animate={{ 
                    x: [0, -4, 0],
                    opacity: [0.5, 0.9, 0.5],
                    scale: [0.85, 1.05, 0.85]
                  }}
                  transition={{ duration: 2.2, delay: 0.7, repeat: Infinity, ease: "easeInOut" }}
                >
                  {/* Efecto de brillo interior */}
                  <motion.div 
                    className="absolute inset-0 rounded-full bg-white/40"
                    animate={{ opacity: [0, 0.5, 0] }}
                    transition={{ duration: 1.5, delay: 0.9, repeat: Infinity }}
                  />
                </motion.div>
                {/* Estela del punto */}
                <motion.div 
                  className="absolute top-0 right-0 w-2 h-2 rounded-full bg-primary/30 blur-[1px]"
                  animate={{ 
                    x: [2, -2, 2],
                    opacity: [0, 0.7, 0]
                  }}
                  transition={{ duration: 2.2, delay: 0.8, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              
              {/* Segundo punto con efecto de arrastre */}
              <div className="relative">
                <motion.div 
                  className="relative z-10 w-2 h-2 rounded-full bg-gradient-to-l from-primary/70 to-primary/90 shadow-[0_0_5px_rgba(var(--primary),0.5)]"
                  animate={{ 
                    x: [0, -4, 0],
                    opacity: [0.5, 0.9, 0.5],
                    scale: [0.85, 1.05, 0.85]
                  }}
                  transition={{ duration: 2.2, delay: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <motion.div 
                    className="absolute inset-0 rounded-full bg-white/40"
                    animate={{ opacity: [0, 0.5, 0] }}
                    transition={{ duration: 1.5, delay: 1.7, repeat: Infinity }}
                  />
                </motion.div>
                <motion.div 
                  className="absolute top-0 right-0 w-2 h-2 rounded-full bg-primary/30 blur-[1px]"
                  animate={{ 
                    x: [2, -2, 2],
                    opacity: [0, 0.7, 0]
                  }}
                  transition={{ duration: 2.2, delay: 1.6, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              
              {/* Tercer punto con efecto de arrastre */}
              <div className="relative">
                <motion.div 
                  className="relative z-10 w-2 h-2 rounded-full bg-gradient-to-l from-primary/70 to-primary/90 shadow-[0_0_5px_rgba(var(--primary),0.5)]"
                  animate={{ 
                    x: [0, -4, 0],
                    opacity: [0.5, 0.9, 0.5],
                    scale: [0.85, 1.05, 0.85]
                  }}
                  transition={{ duration: 2.2, delay: 2.3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <motion.div 
                    className="absolute inset-0 rounded-full bg-white/40"
                    animate={{ opacity: [0, 0.5, 0] }}
                    transition={{ duration: 1.5, delay: 2.5, repeat: Infinity }}
                  />
                </motion.div>
                <motion.div 
                  className="absolute top-0 right-0 w-2 h-2 rounded-full bg-primary/30 blur-[1px]"
                  animate={{ 
                    x: [2, -2, 2],
                    opacity: [0, 0.7, 0]
                  }}
                  transition={{ duration: 2.2, delay: 2.4, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </div>
          </div>
        </>
      )}
      
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
                    item.path === '#notifications' && unreadCount > 0 
                      ? "text-primary animate-pulse" 
                      : "text-muted-foreground"
                  )} />
                  {item.badge && (
                    <span className="absolute top-1 right-1 flex items-center justify-center min-w-5 h-5 text-xs 
                      font-bold text-white bg-red-500 rounded-full px-1 animate-pulse">
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
        <SheetContent 
          side="left" 
          className="w-[280px] p-0"
          aria-label="Menú de navegación"
        >
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
            
            {/* Sección de usuarios en línea */}
            <div className="p-3 border-b">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 text-sm font-medium">
                  <Users className="h-4 w-4 text-primary" />
                  <span>Usuarios en línea</span>
                  <span className="bg-primary/10 text-primary text-xs font-medium px-1.5 py-0.5 rounded-full ml-1">{onlineUsers.length}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {onlineUsers.length > 0 ? (
                  onlineUsers.slice(0, 5).map((user) => (
                    <div 
                      key={user.userId} 
                      className="flex items-center gap-1 bg-muted/40 rounded-full px-2 py-0.5 text-xs"
                    >
                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      <span className="font-medium">{user.username}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground">No hay usuarios en línea</div>
                )}
                {onlineUsers.length > 5 && (
                  <div className="text-xs text-muted-foreground bg-muted/40 rounded-full px-2 py-0.5">
                    +{onlineUsers.length - 5} más
                  </div>
                )}
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

      {/* Panel de notificaciones optimizado para móvil */}
      <Sheet open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
        <SheetContent 
          side="right" 
          className="w-[320px] sm:w-[380px] p-0"
          aria-label="Centro de notificaciones"
        >
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-lg" id="notifications-heading">Notificaciones</h3>
              {unreadCount > 0 && (
                <div className="bg-primary/10 text-primary text-sm font-medium px-2 py-1 rounded-md">
                  {unreadCount} {unreadCount === 1 ? 'nueva' : 'nuevas'}
                </div>
              )}
            </div>
            <div 
              className="flex-1 overflow-hidden" 
              aria-labelledby="notifications-heading"
              role="region"
            >
              <MobileNotificationCenter />
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Ayuda de gestos táctiles para usuarios móviles */}
      <AnimatePresence>
        {showSwipeHelp && isMobile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center px-4"
          >
            <div className="bg-background/90 backdrop-blur-md p-6 rounded-xl shadow-xl border border-primary/10 max-w-[350px] text-center relative overflow-hidden">
              {/* Decoración de fondo */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-gradient-to-br from-primary/60 to-primary/10 blur-xl" />
                <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-gradient-to-tl from-primary/60 to-primary/10 blur-xl" />
              </div>
              
              {/* Indicador de diálogo */}
              <div className="text-primary mb-1 flex justify-center">
                <motion.span 
                  className="inline-block w-12 h-1 bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20 rounded-full"
                  animate={{ width: ["45px", "35px", "45px"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              
              {/* Título con efecto de gradiente */}
              <h3 className="text-xl font-medium mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Navegación por gestos
              </h3>
              
              <div className="flex justify-between items-stretch gap-6 mb-5 mt-5">
                {/* Panel izquierdo */}
                <div className="flex-1 flex flex-col items-center">
                  <motion.div 
                    className="relative rounded-xl bg-primary/5 p-3.5 mb-3 border border-primary/20 shadow-sm overflow-hidden"
                    initial={{ x: -15 }}
                    animate={{ x: 0 }}
                    transition={{ repeat: 2, duration: 0.8, delay: 0.5 }}
                  >
                    <ArrowRightFromLine className="h-6 w-6 text-primary relative z-10" />
                    {/* Resplandor interior */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                    />
                  </motion.div>
                  <span className="text-sm font-medium">Desliza desde <br/><strong className="text-primary">borde izquierdo</strong></span>
                  <span className="text-xs text-muted-foreground mt-1">Abre el menú principal</span>
                </div>
                
                {/* Separador central */}
                <div className="bg-gradient-to-b from-muted/10 via-muted/40 to-muted/10 w-px h-auto rounded-full mx-2" />
                
                {/* Panel derecho */}
                <div className="flex-1 flex flex-col items-center">
                  <motion.div 
                    className="relative rounded-xl bg-primary/5 p-3.5 mb-3 border border-primary/20 shadow-sm overflow-hidden"
                    initial={{ x: 15 }}
                    animate={{ x: 0 }}
                    transition={{ repeat: 2, duration: 0.8, delay: 1.5 }}
                  >
                    <ArrowLeftFromLine className="h-6 w-6 text-primary relative z-10" />
                    {/* Resplandor interior */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-l from-transparent via-primary/20 to-transparent"
                      animate={{ x: ['100%', '-100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1, delay: 0.8 }}
                    />
                  </motion.div>
                  <span className="text-sm font-medium">Desliza desde <br/><strong className="text-primary">borde derecho</strong></span>
                  <span className="text-xs text-muted-foreground mt-1">Abre notificaciones</span>
                </div>
              </div>
              
              {/* Mensaje de cierre automático */}
              <div className="flex justify-center mt-2">
                <motion.div 
                  className="px-4 py-1.5 rounded-full text-xs bg-primary/10 text-primary font-medium shadow-inner border border-primary/10"
                  animate={{ opacity: [0.7, 1, 0.7], boxShadow: ['inset 0 1px 2px rgba(0,0,0,0.1)', 'inset 0 1px 4px rgba(0,0,0,0.2)', 'inset 0 1px 2px rgba(0,0,0,0.1)'] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  Este mensaje desaparecerá automáticamente
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}