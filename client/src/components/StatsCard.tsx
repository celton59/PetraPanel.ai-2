import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// Definimos un tipo de icono más flexible que puede ser un componente SVG o JSX
type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement> & { className?: string }>;

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: IconComponent;
  className?: string;
  animation?: any;
}

const StatsCard = ({ title, value, change, isPositive, icon: Icon, className, animation }: StatsCardProps) => {
  return (
    <Card className={cn(
      "transition-all duration-200 hover:scale-[1.02]",
      "border border-muted/40 rounded-lg shadow-sm hover:shadow-md", 
      "overflow-hidden", 
      className
    )}>
      <CardContent className="p-4 relative">
        {/* Rich gradient accent based on status */}
        <div className={cn(
          "absolute top-0 left-0 w-full h-1", 
          isPositive 
            ? "bg-gradient-to-r from-emerald-600 via-green-500 to-lime-400" 
            : "bg-gradient-to-r from-rose-600 via-red-500 to-red-400"
        )}></div>
        
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div 
            className={cn(
              "p-2 rounded-lg flex items-center justify-center",
              isPositive ? "bg-green-100/50 dark:bg-green-900/20" : "bg-red-100/50 dark:bg-red-900/20"
            )}
          >
            <Icon 
              className={cn(
                "w-4 h-4", 
                isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )} 
            />
          </div>
        </div>
        
        <div>
          <h3 className="text-2xl font-bold mb-1">
            {value}
          </h3>
          <p className={cn(
            "text-xs font-medium",
            isPositive 
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          )}>
            {change}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;