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
            Información importante sobre el uso de enlaces de afiliación en tus videos
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 text-sm">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Requisito legal importante
            </h3>
            <p>
              Para cumplir con las normas de la FTC y las leyes de publicidad, <strong>es obligatorio mencionar verbalmente</strong> en el video cuando se incluyen enlaces de afiliación. 
            </p>
          </div>
          
          <h3 className="font-semibold">¿Qué son los enlaces de afiliación?</h3>
          <p>
            Los enlaces de afiliación son URLs especiales que contienen un código de seguimiento único. 
            Cuando los espectadores hacen clic en estos enlaces y realizan una compra, tú o el canal reciben una comisión.
          </p>
          
          <h3 className="font-semibold">¿Por qué necesitan mención verbal?</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Es un <strong>requisito legal</strong> informar claramente a tu audiencia que estás utilizando enlaces de afiliación.</li>
            <li>Simplemente incluir los enlaces en la descripción <strong>no es suficiente</strong>.</li>
            <li>Debes mencionar verbalmente en el video que usas enlaces de afiliación y que puedes recibir una comisión.</li>
          </ul>
          
          <h3 className="font-semibold">¿Cómo mencionarlo correctamente?</h3>
          <p>
            Ejemplo: <em>"Los enlaces en la descripción son de afiliación, lo que significa que podría recibir una comisión si realizas una compra, sin costo adicional para ti."</em>
          </p>
          
          <h3 className="font-semibold">Consecuencias de no cumplir</h3>
          <p>
            No divulgar adecuadamente los enlaces de afiliación puede resultar en:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Multas por parte de organismos reguladores</li>
            <li>Pérdida de confianza de tu audiencia</li>
            <li>Terminación de programas de afiliación</li>
            <li>Posibles problemas legales para ti y el canal</li>
          </ul>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => window.open("https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers", "_blank")}
          >
            Guía de la FTC <ExternalLink className="h-3 w-3" />
          </Button>
          <Button type="submit">Entendido</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}