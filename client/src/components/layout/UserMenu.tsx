import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Bell, Cog, HelpCircle, LogOut, MessageSquare, Search, Settings, User } from "lucide-react"
import { ThemeToggle } from "./ThemeToggle"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useLocation } from "wouter"
import { useUser } from "@/hooks/use-user"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"

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
        
        {/* Help button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="hidden sm:flex"
          onClick={() => {
            // Help functionality would go here
          }}
        >
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
        </Button>
        
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
        
        {/* Messages */}
        <Button variant="ghost" size="icon" className="relative">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <Badge 
            variant="secondary" 
            className="h-5 w-5 p-0 min-w-0 absolute -top-1.5 -right-1.5 flex items-center justify-center bg-primary text-primary-foreground"
          >
            2
          </Badge>
        </Button>
        
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