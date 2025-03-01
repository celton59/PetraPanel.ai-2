import { cn } from "@/lib/utils"
import { ChevronRight, Home } from "lucide-react"
import { Link, useLocation } from "wouter"

interface BreadcrumbsProps {
  className?: string
}

const routeMap: Record<string, string> = {
  "videos": "Videos",
  "perfil": "Mi Perfil",
  "ajustes": "Configuración",
  "estadisticas": "Estadísticas",
  "traductor": "Traductor de Videos"
}

export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const [location] = useLocation()
  
  if (location === "/") return null
  
  const segments = location.split("/").filter(Boolean)
  
  return (
    <div className={cn("flex items-center text-sm text-muted-foreground", className)}>
      <Link href="/" className="flex items-center hover:text-foreground transition-colors">
        <Home className="h-3.5 w-3.5 mr-1" />
        <span>Inicio</span>
      </Link>
      
      {segments.map((segment, index) => {
        const path = `/${segments.slice(0, index + 1).join("/")}`
        const label = routeMap[segment] || segment
        
        return (
          <div key={path} className="flex items-center">
            <ChevronRight className="h-3.5 w-3.5 mx-1.5 text-muted-foreground/60" />
            <Link 
              href={path}
              className={cn(
                "hover:text-foreground transition-colors",
                index === segments.length - 1 ? "text-foreground font-medium" : ""
              )}
            >
              {label}
            </Link>
          </div>
        )
      })}
    </div>
  )
}