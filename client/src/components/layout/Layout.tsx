import { Sidebar } from "./Sidebar"
import { UserMenu } from "./UserMenu"
import { useLocation } from "wouter"
import { SearchButton, GlobalSearch } from "@/components/global-search"
import { MobileNavBar } from "./MobileNavBar"
import { VersionInfo } from "./VersionInfo"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-gradient-to-r from-background via-background to-background shadow-sm">
        <div className="flex items-center h-14">
          <Sidebar />
          
          {/* Global search bar - desktop */}
          <div className="hidden md:flex mx-4 flex-1">
            <SearchButton 
              variant="outline" 
              className="w-full max-w-md justify-start bg-muted/40 border-muted hover:bg-muted/60 focus:bg-background transition-colors rounded-md"
            />
          </div>
          
          <UserMenu />
        </div>
      </header>
      <main className="flex-1 px-4 md:px-8 py-4 md:py-8 pb-20 md:pb-8">
        {children}
      </main>
      
      {/* Barra de navegación inferior para móviles */}
      <MobileNavBar />
      
      {/* Global search component (diálogo) */}
      <GlobalSearch />
      
      {/* Información de versión (pie de página) - Móvil y escritorio */}
      <footer className="md:flex items-center justify-center border-t py-2">
        {/* En móvil, posicionamos el footer justo arriba de la navbar */}
        <div className="flex md:hidden fixed bottom-[48px] left-0 right-0 justify-center border-t py-1 bg-background text-xs">
          <VersionInfo />
        </div>
        
        {/* Versión para escritorio se mantiene */}
        <div className="hidden md:block">
          <VersionInfo />
        </div>
      </footer>
    </div>
  )
}