import { Sidebar } from "./Sidebar"
import { UserMenu } from "./UserMenu"
import { useLocation } from "wouter"
import { SearchButton, GlobalSearch } from "@/components/global-search"

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
      <main className="flex-1 px-8 py-8">
        {children}
      </main>
      
      {/* Global search component (diálogo) */}
      <GlobalSearch />
    </div>
  )
}