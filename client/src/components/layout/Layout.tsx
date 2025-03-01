import { Sidebar } from "./Sidebar"
import { UserMenu } from "./UserMenu"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Breadcrumbs } from "./Breadcrumbs"
import { useLocation } from "wouter"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation()
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-gradient-to-r from-background via-background to-background shadow-sm">
        <div className="flex items-center h-14">
          <Sidebar />
          
          {/* Global search bar - desktop */}
          <div className="hidden md:flex max-w-md relative mx-4 flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar videos, proyectos..." 
              className="pl-9 h-9 bg-muted/40 border-muted hover:bg-muted/60 focus:bg-background transition-colors rounded-md"
            />
          </div>
          
          <UserMenu />
        </div>
        
        {/* Breadcrumbs navigation - shows on pages except dashboard */}
        {location !== "/" && (
          <div className="px-4 h-10 flex items-center border-t border-border/40">
            <Breadcrumbs />
          </div>
        )}
      </header>
      <main className="flex-1 px-8 py-8">
        {children}
      </main>
    </div>
  )
}