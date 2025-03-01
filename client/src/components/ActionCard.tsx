import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColor?: string;
  iconBgColor?: string;
  className?: string;
  onClick?: () => void;
}

const ActionCard = ({ 
  icon: Icon, 
  title, 
  description, 
  iconColor = "text-primary", 
  iconBgColor = "bg-primary/10",
  className,
  onClick 
}: ActionCardProps) => {
  return (
    <Card 
      className={cn(
        "cursor-pointer",
        "transition-all duration-200 hover:shadow-md border rounded-lg",
        className
      )}
      onClick={onClick}
    >
      <div className="p-5 flex">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center mr-4",
          iconBgColor
        )}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
        
        <div>
          <h3 className="font-medium text-base mb-1">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default ActionCard;