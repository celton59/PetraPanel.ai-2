import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getInitials } from "@/lib/utils";
import { User, UserCog } from "lucide-react";

interface UserBadgesSimpleProps {
  creator?: string | null;
  optimizer?: string | null;
  size?: "xs" | "sm" | "md";
}

export function UserBadges({ creator, optimizer, size = "md" }: UserBadgesSimpleProps) {
  const roles = [
    creator && {
      name: "Creador",
      icon: User,
      fullName: creator,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
      iconColor: "text-blue-500"
    },
    optimizer && {
      name: "Optimizador",
      icon: UserCog,
      fullName: optimizer,
      color: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
      iconColor: "text-purple-500"
    }
  ].filter(Boolean);

  const sizeClasses = {
    xs: "p-1 text-[10px]",
    sm: "p-1.5 text-xs",
    md: "px-2 py-1.5 text-sm"
  };
  
  const iconSizes = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4"
  };

  if (roles.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      <TooltipProvider>
        {roles.map((role, idx) => role && (
          <Tooltip key={idx}>
            <TooltipTrigger asChild>
              <div 
                className={`flex items-center ${sizeClasses[size]} rounded-full ${role.color} cursor-help transition-all duration-150 hover:ring-2 hover:ring-primary/20`}
              >
                <div className="flex items-center space-x-1.5">
                  <role.icon className={`${iconSizes[size]} ${role.iconColor}`} />
                  <span className={`font-medium ${size === "xs" ? "hidden sm:inline" : ""}`}>
                    {size === "xs" ? getInitials(role.fullName) : role.name}
                  </span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="center" className="p-2 max-w-xs text-xs">
              <div className="font-medium">{role.name}</div>
              {role.fullName ? (
                <div className="text-muted-foreground">
                  {role.fullName}
                </div>
              ) : (
                <div className="text-muted-foreground">No asignado</div>
              )}
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}