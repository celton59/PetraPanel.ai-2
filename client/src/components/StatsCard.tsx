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
      "bg-gradient-to-br from-background to-muted/50 transition-all duration-300 hover:scale-[1.02]",
      "border border-muted rounded-xl shadow-sm hover:shadow-md dark:shadow-primary/5", 
      "overflow-hidden backdrop-blur-sm", 
      className
    )}>
      <CardContent className="p-6 relative overflow-hidden">
        {/* Decorative accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 via-primary/20 to-transparent"></div>
        
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">{title}</p>
          <motion.div 
            className="p-2.5 rounded-xl bg-primary/10 transition-colors duration-200 group-hover:bg-primary/20 shadow-inner" 
            animate={animation}
            whileHover={{ scale: 1.1 }}
          >
            <Icon className="w-5 h-5 text-primary" />
          </motion.div>
        </div>
        <div className="space-y-1">
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight">{value}</h3>
          <p className={`text-sm font-medium flex items-center gap-1 ${isPositive ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
            <motion.span 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {isPositive ? '+' : ''}{change}
            </motion.span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;