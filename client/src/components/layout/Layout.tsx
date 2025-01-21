import { Sidebar } from "./Sidebar"
import { UserMenu } from "../UserMenu"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b flex items-center">
        <Sidebar />
        <UserMenu />
      </header>
      <main className="flex-1 container py-6">
        {children}
      </main>
    </div>
  )
}