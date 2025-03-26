import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info, ExternalLink } from "lucide-react";

interface AffiliateInfoDialogProps {
  trigger?: React.ReactNode;
  variant?: "icon" | "button";
}

export function AffiliateInfoDialog({ trigger, variant = "button" }: AffiliateInfoDialogProps) {
  const defaultTrigger = variant === "icon" ? (
    <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-blue-500">
      <Info className="h-4 w-4" />
      <span className="sr-only">Información sobre enlaces de afiliación</span>
    </Button>
  ) : (
    <Button variant="outline" size="sm" className="gap-2">
      <Info className="h-4 w-4" />
      <span>Información sobre enlaces de afiliación</span>
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enlaces de afiliación en videos</DialogTitle>
          <DialogDescription>
            Consejos para mejorar la experiencia de tus espectadores con enlaces de afiliación
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 text-sm">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Recordatorio importante
            </h3>
            <p>
              Para ofrecer la mejor experiencia a tus espectadores, <strong>es recomendable mencionar verbalmente</strong> en el video cuando incluyas enlaces de afiliación.
            </p>
          </div>
          
          <h3 className="font-semibold">¿Qué son los enlaces de afiliación?</h3>
          <p>
            Los enlaces de afiliación son URLs especiales que contienen un código de seguimiento único. 
            Cuando los espectadores hacen clic en estos enlaces y realizan una compra, tú o el canal reciben una comisión.
          </p>
          
          <h3 className="font-semibold">¿Por qué es bueno mencionarlos verbalmente?</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Mejora la <strong>transparencia</strong> con tu audiencia</li>
            <li>Simplemente incluirlos en la descripción puede pasar desapercibido</li>
            <li>Aumenta la probabilidad de que tu audiencia utilice los enlaces</li>
            <li>Construye una relación de confianza con tus seguidores</li>
          </ul>
          
          <h3 className="font-semibold">¿Cómo mencionarlo de forma natural?</h3>
          <p>
            Ejemplo: <em>"En la descripción encontrarás enlaces para todos los productos que uso en este video. Si compras a través de ellos, apoyas al canal sin costo adicional para ti."</em>
          </p>
          
          <h3 className="font-semibold">Beneficios de hacerlo correctamente</h3>
          <p>
            Mencionar claramente los enlaces de afiliación tiene varias ventajas:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Mayor engagement con tu audiencia</li>
            <li>Aumento en el uso de tus enlaces de afiliación</li>
            <li>Mejor reputación como creador de contenido</li>
            <li>Relaciones más estables con marcas y programas de afiliados</li>
          </ul>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => window.open("https://creator.amazon.com/es-es/influencer-program-guides-and-best-practices", "_blank")}
          >
            Buenas prácticas <ExternalLink className="h-3 w-3" />
          </Button>
          <Button type="submit">Entendido</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}