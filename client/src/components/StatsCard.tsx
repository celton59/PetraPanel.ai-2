import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: LucideIcon;
  className?: string;
  animation?: any;
}

const StatsCard = ({ title, value, change, isPositive, icon: Icon, className, animation }: StatsCardProps) => {
  return (
    <Card className={cn(
      "border rounded-lg shadow-sm hover:shadow-md transition-all duration-300",
      className
    )}>
      <CardContent className="p-5 relative">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="p-2 rounded-full bg-primary/10">
            <Icon className="w-4 h-4 text-primary" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">
            {value}
          </h3>
          <div className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1.5",
            isPositive 
              ? "text-green-700 dark:text-green-400 bg-green-100/50 dark:bg-green-900/20" 
              : "text-red-700 dark:text-red-400 bg-red-100/50 dark:bg-red-900/20"
          )}>
            <span className="h-1 w-1 rounded-full bg-current"></span>
            <span>{change}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;