import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Bell, Cog, LogOut, MessageSquare, Search, Settings, User } from "lucide-react"
import { ThemeToggle } from "./ThemeToggle"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useLocation } from "wouter"
import { useUser } from "@/hooks/use-user"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { HelpButton } from "@/components/help/HelpButton"
import { OnlineUsersIndicator } from "../users/OnlineUsersIndicator"

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className }: UserMenuProps) {
  const [, setLocation] = useLocation()
  const { user, logout } = useUser()
  const [notifications, setNotifications] = useState(3) // Demo notifications count
  
  // Simulate online status - just for demo
  const [isOnline, setIsOnline] = useState(true)
  
  // Demo effect - pulse animation for the online indicator
  useEffect(() => {
    const interval = setInterval(() => {
      setIsOnline(prev => !prev)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  if (!user) {
    return (
      <div className={`flex items-center px-4 h-14 ${className}`}>
        <div className="flex items-center space-x-4 ml-auto">
          <ThemeToggle />
          <Separator orientation="vertical" className="h-6" />
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center px-4 h-14 ${className}`}>
      <div className="flex items-center space-x-2 sm:space-x-4 ml-auto">
        {/* Mobile search button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden"
          onClick={() => {
            // Mobile search functionality would go here
          }}
        >
          <Search className="h-5 w-5 text-muted-foreground" />
        </Button>
        
        {/* Indicador de usuarios en línea */}
        <OnlineUsersIndicator />
        
        {/* Help button */}
        <HelpButton />
        
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {notifications > 0 && (
                <Badge 
                  variant="destructive" 
                  className="h-5 w-5 p-0 min-w-0 absolute -top-1.5 -right-1.5 flex items-center justify-center"
                >
                  {notifications}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {Array(notifications).fill(0).map((_, i) => (
                <DropdownMenuItem key={i} className="py-3 cursor-pointer">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} />
                      <AvatarFallback>PL</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">Nuevo comentario en video</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        El usuario ha dejado un comentario en el video "Cómo configurar una API en Node.js"
                      </p>
                      <p className="text-xs text-muted-foreground/60">hace 10 minutos</p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
              {notifications === 0 && (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No tienes notificaciones
                </div>
              )}
            </div>
            <DropdownMenuSeparator />
            <Button 
              variant="ghost" 
              className="w-full justify-center text-sm" 
              onClick={() => setNotifications(0)}
            >
              Marcar todas como leídas
            </Button>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Messages dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <Badge 
                variant="secondary" 
                className="h-5 w-5 p-0 min-w-0 absolute -top-1.5 -right-1.5 flex items-center justify-center bg-primary text-primary-foreground"
              >
                2
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex justify-between items-center">
              <span>Mensajes</span>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                Ver todos
              </Button>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {/* Ejemplo de mensaje 1: Director creativo */}
              <DropdownMenuItem className="py-3 cursor-pointer">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9 border-2 border-primary/20">
                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ana" />
                    <AvatarFallback>AC</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium leading-none">Ana Cortés</p>
                      <p className="text-xs text-muted-foreground">10:25 AM</p>
                    </div>
                    <p className="text-xs text-foreground font-medium">Director Creativo</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      Los cambios en el video de marketing están casi listos. Necesito que revises las correcciones de audio antes de publicarlo.
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
              
              {/* Ejemplo de mensaje 2: Equipo de edición */}
              <DropdownMenuItem className="py-3 cursor-pointer bg-muted/50 border-l-2 border-primary">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Pedro" />
                    <AvatarFallback>PM</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between">
                      <p className="text-sm font-semibold leading-none">Pedro Martínez</p>
                      <p className="text-xs text-muted-foreground">Ayer</p>
                    </div>
                    <p className="text-xs text-foreground font-medium">Equipo de Edición</p>
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-muted-foreground line-clamp-2 font-medium">
                        He subido el nuevo material para el proyecto "Lanzamiento 2025" ¿Puedes revisarlo hoy?
                      </p>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
              
              {/* Mensaje con archivo adjunto */}
              <DropdownMenuItem className="py-3 cursor-pointer">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia" />
                    <AvatarFallback>SL</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium leading-none">Sofía López</p>
                      <p className="text-xs text-muted-foreground">Mar 28</p>
                    </div>
                    <p className="text-xs text-foreground font-medium">Traducción</p>
                    <div className="text-xs text-muted-foreground">
                      <p className="line-clamp-1">Aquí están los subtítulos en francés que solicitaste para el video promocional.</p>
                      <div className="mt-2 p-2 rounded bg-muted/80 flex items-center gap-2 border text-xs">
                        <svg className="h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <span className="font-medium">subtitulos_frances.srt</span>
                      </div>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <div className="p-3">
              <div className="relative">
                <Input 
                  placeholder="Escribe un mensaje..." 
                  className="pr-10 text-sm"
                />
                <Button 
                  size="icon" 
                  className="h-7 w-7 absolute right-1 top-1 text-primary"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="m22 2-7 20-4-9-9-4Z" />
                    <path d="M22 2 11 13" />
                  </svg>
                </Button>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <ThemeToggle />
        <Separator orientation="vertical" className="h-6" />

        {/* User profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="relative h-8 rounded-full px-2 flex items-center gap-2 sm:pr-3 hover:bg-muted"
            >
              <div className="relative">
                <Avatar className="h-8 w-8 border-2 border-background">
                  <AvatarImage src={user.avatarUrl || undefined} alt={user.username} />
                  <AvatarFallback>
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {/* Online status indicator */}
                <span className={cn(
                  "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background",
                  isOnline ? "bg-green-500" : "bg-yellow-500",
                  isOnline && "animate-pulse"
                )} />
              </div>
              
              {/* Show username on larger screens */}
              <span className="hidden sm:block text-sm font-medium">
                {user.fullName || user.username}
              </span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent 
            className="w-60" 
            align="end" 
            forceMount
            sideOffset={8}
          >
            <div className="flex items-center gap-3 p-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatarUrl || undefined} alt={user.username} />
                <AvatarFallback>
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium leading-none">{user.fullName || user.username}</p>
                <p className="text-xs mt-1 text-muted-foreground">
                  <span className="capitalize">{user.role}</span>
                  {" · "}
                  <span className="text-green-500">En línea</span>
                </p>
                <p className="text-xs text-muted-foreground/70 font-medium">{user.email}</p>
              </div>
            </div>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuGroup>
              <DropdownMenuItem 
                onClick={() => setLocation('/perfil')}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Mi Perfil</span>
              </DropdownMenuItem>
              
              {user.role === 'admin' && (
                <DropdownMenuItem 
                  onClick={() => setLocation('/ajustes')}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={async () => {
                await logout();
                setLocation('/autenticacion');
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}