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
      "bg-gradient-to-br from-background via-background to-primary/5 transition-all duration-300 hover:scale-[1.02]",
      "border border-muted/80 rounded-xl shadow-sm hover:shadow-xl dark:hover:shadow-primary/10", 
      "overflow-hidden backdrop-blur-sm relative", 
      className
    )}>
      <CardContent className="p-6 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary/50 via-primary/30 to-transparent"></div>
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-transparent to-primary/5 rounded-tr-3xl"></div>
        
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">{title}</p>
          <motion.div 
            className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 transition-colors duration-200 
                       shadow-sm hover:shadow-md border border-primary/10 backdrop-blur-sm" 
            animate={animation}
            whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0], transition: { duration: 0.5 } }}
          >
            <Icon className="w-5 h-5 text-primary" />
          </motion.div>
        </div>
        
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <h3 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            {value}
          </h3>
          <div className={cn(
            "text-sm font-medium px-2 py-1 rounded-full inline-flex items-center gap-1.5",
            isPositive 
              ? "text-green-700 dark:text-green-400 bg-green-100/50 dark:bg-green-900/20 border border-green-200/80 dark:border-green-800/30" 
              : "text-red-700 dark:text-red-400 bg-red-100/50 dark:bg-red-900/20 border border-red-200/80 dark:border-red-800/30"
          )}>
            <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
            <motion.span 
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {change}
            </motion.span>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;