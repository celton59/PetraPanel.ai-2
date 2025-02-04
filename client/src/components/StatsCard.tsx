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
    <Card className={cn("bg-gradient-to-br from-background to-muted/50 transition-all duration-300 hover:scale-[1.02]", className)}>
      <CardContent className="p-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <motion.div className="p-2.5 rounded-xl bg-primary/10 transition-colors duration-200 group-hover:bg-primary/20" animate={animation}>
            <Icon className="w-5 h-5 text-primary" />
          </motion.div>
        </div>
        <div className="space-y-1">
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight">{value}</h3>
          <p className={`text-sm font-medium ${isPositive ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
            {isPositive ? '+' : ''}{change}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;