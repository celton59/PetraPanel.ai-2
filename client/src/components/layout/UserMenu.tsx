import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"
import { ThemeToggle } from "./ThemeToggle"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useLocation } from "wouter"
import { useUser } from "@/hooks/use-user"

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className }: UserMenuProps) {
  const [, setLocation] = useLocation()
  const { user, logout } = useUser()

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
      <div className="flex items-center space-x-4 ml-auto">
        <ThemeToggle />
        <Separator orientation="vertical" className="h-6" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar>
                <AvatarImage src={user?.avatarUrl || undefined} />
                <AvatarFallback>
                  {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent 
            className="w-56" 
            align="end" 
            forceMount
            sideOffset={8}
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.username || 'Usuario'}</p>
                <p className="text-xs leading-none text-muted-foreground capitalize">
                  {user?.role || 'usuario'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem 
                onClick={() => setLocation('/perfil')}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Mi Perfil</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600"
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