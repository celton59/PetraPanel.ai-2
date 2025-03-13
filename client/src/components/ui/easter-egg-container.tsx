import { useEasterEggs } from "@/hooks/use-easter-eggs";
import { EasterEgg } from "@/components/ui/easter-egg";

/**
 * Contenedor para mostrar easter eggs
 * Este componente debe colocarse cerca de la raíz de la aplicación
 * para que los easter eggs estén siempre disponibles
 */
export function EasterEggContainer() {
  const { activeEasterEgg } = useEasterEggs();
  
  if (!activeEasterEgg) return null;
  
  return (
    <EasterEgg
      key={activeEasterEgg.key}
      type={activeEasterEgg.type}
      message={activeEasterEgg.message}
      duration={activeEasterEgg.duration}
      showOnce={activeEasterEgg.showOnce}
      id={activeEasterEgg.id}
      position={activeEasterEgg.position}
    />
  );
}