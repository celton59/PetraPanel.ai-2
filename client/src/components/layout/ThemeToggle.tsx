import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/use-theme"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="relative hover:bg-muted transition-colors"
          >
            {/* Sun icon with rays animation */}
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-300 
              dark:-rotate-90 dark:scale-0" />
            
            {/* Moon icon with stars animation */}
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-300 
              dark:rotate-0 dark:scale-100" />
              
            {/* Hidden accessible label */}
            <span className="sr-only">
              {theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            </span>
            
            {/* Subtle highlight effect when clicked */}
            <span 
              className="absolute inset-0 rounded-md ring-0 ring-primary/50 opacity-0 
              transition-opacity group-active:ring-2 group-active:opacity-100" 
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}