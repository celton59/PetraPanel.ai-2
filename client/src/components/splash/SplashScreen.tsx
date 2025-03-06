import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LogoWithBlink } from '@/components/layout/LogoWithBlink';
import { Button } from '@/components/ui/button';
import './SplashScreen.css';

interface SplashScreenProps {
  onComplete: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const steps = [
  {
    title: "Idea",
    description: "Todo comienza con una idea brillante",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    ),
    color: "bg-amber-500",
  },
  {
    title: "Creación",
    description: "Tu contenido cobra vida con cada palabra",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="M2 2l7.586 7.586" />
        <circle cx="11" cy="11" r="2" />
      </svg>
    ),
    color: "bg-teal-500",
  },
  {
    title: "Optimización",
    description: "Afinamos cada detalle para destacar",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    color: "bg-indigo-500",
  },
  {
    title: "Multilingüe",
    description: "Tu mensaje llega a audiencias globales",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    color: "bg-violet-500",
  },
  {
    title: "Publicación",
    description: "Compartido con el mundo entero",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
    ),
    color: "bg-rose-500",
  },
];

export function SplashScreen({ onComplete, autoClose = true, autoCloseDelay = 6000 }: SplashScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    // Avanzar automáticamente por los pasos
    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 1200);
      
      return () => clearTimeout(timer);
    }
    
    // Auto cierre después de completar todos los pasos
    if (autoClose && currentStep >= steps.length) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Pequeño retraso para que termine la animación de salida
        setTimeout(onComplete, 500);
      }, autoCloseDelay);
      
      return () => clearTimeout(timer);
    }
  }, [currentStep, autoClose, autoCloseDelay, onComplete]);

  // Gestionar cierre manual
  const handleClose = () => {
    setIsVisible(false);
    // Pequeño retraso para que termine la animación de salida
    setTimeout(onComplete, 500);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Fondo con patrón sutil */}
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          
          {/* Elementos flotantes decorativos */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              className="absolute top-[10%] left-[15%] text-primary/20 animate-float-slow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"></path>
              </svg>
            </motion.div>
            
            <motion.div 
              className="absolute top-[25%] right-[10%] text-indigo-500/20 animate-float"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm1-11v2h1a3 3 0 0 1 0 6h-1v1a1 1 0 0 1-2 0v-1H8a1 1 0 0 1 0-2h3v-2h-1a3 3 0 0 1 0-6h1V6a1 1 0 0 1 2 0v1h3a1 1 0 0 1 0 2h-3zm-2 0h-1a1 1 0 1 0 0 2h1V9zm2 6h1a1 1 0 0 0 0-2h-1v2z"></path>
              </svg>
            </motion.div>
            
            <motion.div 
              className="absolute bottom-[20%] left-[10%] text-amber-500/20 animate-float-slower"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.17 2.17c-5.1 0-9.25 4.14-9.25 9.24 0 5.1 4.15 9.24 9.25 9.24s9.24-4.14 9.24-9.24c0-5.1-4.14-9.24-9.24-9.24zm0 16.74c-4.14 0-7.49-3.35-7.49-7.5 0-4.14 3.35-7.49 7.49-7.49 4.14 0 7.49 3.35 7.49 7.5 0 4.14-3.35 7.49-7.49 7.49z"></path>
                <path d="M15.49 9.63h-2.58V6.5c0-.46-.37-.83-.83-.83s-.83.37-.83.83v3.96c0 .46.37.83.83.83h3.41c.46 0 .83-.37.83-.83s-.37-.83-.83-.83z"></path>
              </svg>
            </motion.div>
            
            <motion.div 
              className="absolute bottom-[30%] right-[15%] text-teal-500/20 animate-float-slow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" viewBox="0 0 24 24" fill="currentColor">
                <rect width="18" height="14" x="3" y="5" rx="2"></rect>
                <path d="M21 8H3M10 14v2M14 14v2M10 7V5M14 7V5"></path>
              </svg>
            </motion.div>
          </div>
          
          {/* Logo animado */}
          <LogoWithBlink className="mb-12 relative z-10" iconSize={60} />
          
          {/* Contenedor principal */}
          <div className="container max-w-xl px-4">
            {/* Fases del recorrido del creador */}
            <div className="relative mb-8 w-full">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted -translate-y-1/2"></div>
              <div className="flex justify-between items-center relative">
                {steps.map((step, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <motion.div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center z-10 text-white transform transition-all duration-500",
                        currentStep > index ? step.color : "bg-muted",
                        currentStep === index && "ring-4 ring-primary/20 scale-125"
                      )}
                      animate={{ 
                        scale: currentStep === index ? 1.25 : 1,
                        opacity: currentStep >= index ? 1 : 0.5
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      {step.icon}
                    </motion.div>
                    
                    <AnimatePresence mode="wait">
                      {currentStep === index && (
                        <motion.div 
                          className="absolute -bottom-24 left-1/2 transform -translate-x-1/2 text-center w-48"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.3 }}
                        >
                          <h3 className="font-bold text-xl mb-1">{step.title}</h3>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Mensaje de carga o finalización */}
            <div className="text-center mt-20">
              <AnimatePresence mode="wait">
                {currentStep < steps.length ? (
                  <motion.p
                    key="loading"
                    className="text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Cargando PetraPanel...
                  </motion.p>
                ) : (
                  <motion.div
                    key="complete"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <h2 className="text-2xl font-bold mb-2">¡Bienvenido a PetraPanel!</h2>
                    <p className="text-muted-foreground mb-8">
                      Tu plataforma para gestionar contenido multilingüe
                    </p>
                    <Button 
                      onClick={handleClose}
                      size="lg"
                      className="px-8 py-6 text-lg"
                    >
                      Comenzar
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Indicador de progreso animado */}
          <div className="absolute bottom-8 left-0 right-0">
            <div className="container max-w-md mx-auto">
              <motion.div 
                className="h-1 bg-primary rounded-full" 
                initial={{ width: "0%" }}
                animate={{ 
                  width: `${(currentStep / (steps.length)) * 100}%` 
                }}
                transition={{ ease: "easeInOut" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}