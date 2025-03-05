import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/use-theme"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ThemeSelector } from "./ThemeSelector"

export function ThemeToggle() {
  const { theme, mode, setTheme } = useTheme()
  
  // Simple toggle for users who prefer the basic toggle
  const toggleTheme = () => {
    if (mode === 'manual') {
      const newTheme = theme === "light" ? "dark" : "light"
      setTheme(newTheme)
    }
  }

  // Advanced selector is now the main component
  return (
    <div className="flex items-center gap-1">
      <ThemeSelector />
    </div>
  )
}