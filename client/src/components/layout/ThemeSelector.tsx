import React, { useState } from "react";
import { 
  Moon, 
  Sun, 
  Computer, 
  Clock, 
  ChevronDown, 
  Check
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { useTheme } from "@/hooks/use-theme";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ThemeSelector() {
  const { theme, mode, scheduledTime, setTheme, setMode, setScheduledTime } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [tempSchedule, setTempSchedule] = useState(scheduledTime);
  
  // Icon mapping for different modes
  const modeIconMap = {
    manual: theme === "light" ? Sun : Moon,
    auto: Computer,
    scheduled: Clock,
  };
  
  // Get current icon based on mode
  const CurrentIcon = modeIconMap[mode];
  
  const handleModeChange = (newMode: string) => {
    setMode(newMode as "manual" | "auto" | "scheduled");
  };
  
  const handleTimeChange = (type: "darkStart" | "lightStart", value: string) => {
    setTempSchedule({
      ...tempSchedule,
      [type]: value,
    });
  };
  
  const saveSchedule = () => {
    setScheduledTime(tempSchedule);
    setIsOpen(false);
  };
  
  const getThemeLabel = () => {
    switch(mode) {
      case "manual":
        return theme === "light" ? "Modo claro" : "Modo oscuro";
      case "auto":
        return "Automático (Sistema)";
      case "scheduled":
        return "Programado";
      default:
        return "Tema";
    }
  };

  return (
    <div className="flex items-center">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 gap-1 px-2 flex items-center"
          >
            <CurrentIcon className="h-4 w-4" />
            <span className="text-xs hidden sm:inline-block">{getThemeLabel()}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="end">
          <div className="grid gap-2">
            <div className="grid grid-cols-3 gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={mode === "manual" && theme === "light" ? "default" : "outline"} 
                      size="sm" 
                      className="flex flex-col items-center justify-center h-14 p-2"
                      onClick={() => {
                        setMode("manual");
                        setTheme("light");
                      }}
                    >
                      <Sun className="h-4 w-4 mb-1" />
                      <span className="text-xs">Claro</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Modo claro</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={mode === "manual" && theme === "dark" ? "default" : "outline"} 
                      size="sm" 
                      className="flex flex-col items-center justify-center h-14 p-2"
                      onClick={() => {
                        setMode("manual");
                        setTheme("dark");
                      }}
                    >
                      <Moon className="h-4 w-4 mb-1" />
                      <span className="text-xs">Oscuro</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Modo oscuro</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={mode === "auto" ? "default" : "outline"} 
                      size="sm" 
                      className="flex flex-col items-center justify-center h-14 p-2"
                      onClick={() => setMode("auto")}
                    >
                      <Computer className="h-4 w-4 mb-1" />
                      <span className="text-xs">Auto</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Seguir preferencia del sistema</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant={mode === "scheduled" ? "default" : "outline"} 
                  size="sm" 
                  className="w-full flex items-center justify-between"
                  onClick={() => {
                    if (mode !== "scheduled") {
                      setMode("scheduled");
                    }
                  }}
                >
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Programar cambio</span>
                  </div>
                  {mode === "scheduled" && <Check className="h-4 w-4" />}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Programar cambio de tema</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="light-start" className="text-right col-span-2">
                      Iniciar modo claro
                    </Label>
                    <Input
                      id="light-start"
                      type="time"
                      className="col-span-2"
                      value={tempSchedule.lightStart}
                      onChange={(e) => handleTimeChange("lightStart", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="dark-start" className="text-right col-span-2">
                      Iniciar modo oscuro
                    </Label>
                    <Input
                      id="dark-start"
                      type="time"
                      className="col-span-2"
                      value={tempSchedule.darkStart}
                      onChange={(e) => handleTimeChange("darkStart", e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="button" onClick={saveSchedule}>
                    Guardar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}