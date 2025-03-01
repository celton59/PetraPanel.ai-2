import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

// Definimos un array de partículas con sus respectivos desplazamientos y retrasos
const particles = [
  { x: 20, y: -20, delay: 0 },
  { x: -20, y: -20, delay: 0.1 },
  { x: 20, y: 20, delay: 0.2 },
  { x: -20, y: 20, delay: 0.3 },
  { x: 0, y: -30, delay: 0.15 },
  { x: 30, y: 0, delay: 0.25 },
  { x: 0, y: 30, delay: 0.35 },
  { x: -30, y: 0, delay: 0.45 },
];

// Componente de partícula: cada una es un pequeño círculo que sale del centro
const Particle = ({ x, y, delay }: { x: number; y: number; delay: number; }) => (
  <motion.div
    className="absolute w-2 h-2 bg-current rounded-full"
    initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
    animate={{ opacity: 0, scale: 0, x, y }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
  />
);

// Componente que envuelve al ícono y dispara el efecto de partículas al hacer hover
const IconWithParticles: React.FC<{ Icon: LucideIcon; iconColor: string; }> = ({ Icon, iconColor }) => {
  const [burst, setBurst] = useState(false);

  return (
    <motion.div
      className="relative flex items-center justify-center"
      onHoverStart={() => {
        setBurst(true);
        // Reiniciamos el estado después de la duración de la animación (700ms)
        setTimeout(() => setBurst(false), 700);
      }}
    >
      {/* Ícono principal */}
      <Icon className={cn("w-6 h-6", iconColor)} />
      {/* Si burst es true, se muestran las partículas */}
      <AnimatePresence>
        {burst &&
          particles.map((particle, index) => (
            <Particle
              key={index}
              x={particle.x}
              y={particle.y}
              delay={particle.delay}
            />
          ))
        }
      </AnimatePresence>
    </motion.div>
  );
};

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
        "transition-all duration-300 hover:scale-[1.03] cursor-pointer",
        "group hover:shadow-xl dark:hover:shadow-primary/10 relative",
        "border border-muted/60 rounded-xl overflow-hidden backdrop-blur-sm",
        className
      )}
      onClick={onClick}
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 opacity-80 z-0"></div>
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary/50 via-primary/30 to-transparent z-10"></div>
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-primary/5 to-transparent z-0"></div>
      
      {/* Action card content */}
      <div className="p-5 md:p-6 z-10 relative">
        {/* Top corner accent */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-2xl"></div>
        
        <motion.div 
          className={cn(
            "w-16 h-16 rounded-xl flex items-center justify-center mb-5",
            "shadow-sm transition-all duration-200 group-hover:shadow-md",
            "bg-gradient-to-br from-primary/20 to-primary/5",
            "border border-primary/20"
          )}
          whileHover={{ 
            scale: 1.2,
            rotate: [0, -10, 10, 0],
            transition: { duration: 0.3, repeat: Infinity }
          }}
          animate={{
            y: [0, -4, 0],
            scale: [1, 1.08, 1],
            rotate: [0, 5, 0, -5, 0]
          }}
          transition={{
            duration: 3,
            ease: "easeInOut",
            repeat: Infinity
          }}
        >
          <IconWithParticles Icon={Icon} iconColor={iconColor} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <h3 className="font-semibold text-xl mb-2 group-hover:text-primary transition-colors bg-gradient-to-r from-foreground to-foreground/90 bg-clip-text text-transparent">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
          
          {/* Badge indicator */}
          <motion.div 
            className="absolute -right-3 -top-3 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Nueva
          </motion.div>
        </motion.div>
        
        {/* Animated accent line */}
        <div className="relative mt-5 h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
          <motion.div 
            className="absolute inset-y-0 left-0 h-full w-0 bg-gradient-to-r from-primary via-primary/80 to-primary/50 rounded-full group-hover:w-full transition-all"
            initial={{ width: "15%" }}
            whileHover={{ width: "100%" }}
            transition={{ duration: 0.8 }}
          />
        </div>
        
        {/* Icon indicator */}
        <motion.div 
          className="absolute bottom-4 right-4 text-primary/40 opacity-30 group-hover:opacity-100 transition-opacity"
          whileHover={{ scale: 1.2, rotate: 15 }}
        >
          <Icon className="w-6 h-6" />
        </motion.div>
      </div>
    </Card>
  );
};

export default ActionCard;