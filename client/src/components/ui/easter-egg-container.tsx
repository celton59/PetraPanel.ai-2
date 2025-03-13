import { useEasterEggs } from "@/hooks/use-easter-eggs";
import { EasterEgg } from "@/components/ui/easter-egg";

/**
 * Contenedor para mostrar easter eggs
 * Se coloca en la raíz de la aplicación para poder mostrar los easter eggs en cualquier pantalla
 */
export function EasterEggContainer() {
  const { activeEasterEgg, hideEasterEgg } = useEasterEggs();
  
  // Si no hay un easter egg activo, no mostrar nada
  if (!activeEasterEgg) return null;
  
  return (
    <EasterEgg
      key={Date.now().toString()} // Clave única para forzar re-render en activaciones consecutivas
      type={activeEasterEgg.type}
      message={activeEasterEgg.message}
      duration={activeEasterEgg.duration}
      showOnce={activeEasterEgg.showOnce}
      id={activeEasterEgg.id}
      position={activeEasterEgg.position}
      isVisible={!!activeEasterEgg}
      onComplete={hideEasterEgg}
    />
  );
}