import React, { createContext, useState, useContext } from 'react';

// Definir el contexto para la guía
type GuideContextType = {
  isOpen: boolean;
  openGuide: () => void;
  closeGuide: () => void;
};

// Crear el contexto
const GuideContext = createContext<GuideContextType>({
  isOpen: false,
  openGuide: () => {},
  closeGuide: () => {},
});

// Proveedor del contexto
export const GuideProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const openGuide = () => setIsOpen(true);
  const closeGuide = () => setIsOpen(false);
  
  return (
    <GuideContext.Provider value={{ isOpen, openGuide, closeGuide }}>
      {children}
    </GuideContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useGuide = () => useContext(GuideContext);