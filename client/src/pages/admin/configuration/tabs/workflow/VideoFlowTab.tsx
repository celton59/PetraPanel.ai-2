import { Card } from "@/components/ui/card";
import { VideoFlowDiagram } from "@/components/video/VideoFlowDiagram";
import { 
  PenLine, 
  Upload, 
  CheckCircle2, 
  Youtube,
  FileVideo,
  FileText
} from "lucide-react";

export function VideoFlowTab() {
  const flowSteps = [
    {
      icon: FileVideo,
      title: "Creación",
      description: "Se crea un nuevo video o artículo en el sistema",
      status: "pending",
      color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    },
    {
      icon: PenLine,
      title: "Optimización",
      description: "Se optimiza el título para mejorar el SEO",
      status: "in_progress",
      color: "bg-blue-500/10 text-blue-500 border-blue-500/20"
    },
    {
      icon: CheckCircle2,
      title: "Revisión de Optimización",
      description: "El equipo revisa las optimizaciones y puede aprobar o solicitar correcciones",
      status: "optimize_review",
      color: "bg-pink-500/10 text-pink-500 border-pink-500/20"
    },
    {
      icon: Upload,
      title: "Revisión de Archivos",
      description: "Se revisan el video y la miniatura antes de la subida a YouTube. En esta etapa se suben y verifican los archivos necesarios.",
      status: "upload_review",
      color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
    },
    {
      icon: Youtube,
      title: "Listo para YouTube",
      description: "Se prepara el contenido para subir a YouTube",
      status: "youtube_ready",
      color: "bg-green-500/10 text-green-500 border-green-500/20"
    },
    {
      icon: CheckCircle2,
      title: "Revisión Final",
      description: "Revisión final antes de la publicación",
      status: "review",
      color: "bg-purple-500/10 text-purple-500 border-purple-500/20"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium">Flujo de Trabajo</h3>
        <p className="text-sm text-muted-foreground">
          Entendiendo el proceso de publicación de contenido
        </p>
      </div>

      <VideoFlowDiagram />

      <div className="relative">
        <div className="absolute top-0 left-12 h-full w-0.5 bg-border" />
        <div className="space-y-8">
          {flowSteps.map((step, index) => (
            <div key={step.status} className="relative">
              <div className="flex items-start gap-6">
                <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border ${step.color}`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <Card className="flex-1 p-4 transition-colors hover:bg-muted/50">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{step.title}</h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                        {step.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </Card>
              </div>
              {index < flowSteps.length - 1 && (
                <div className="absolute left-[19px] top-10 h-8 w-0.5 bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card className="p-4 border-orange-500/20 bg-orange-500/5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-500/20 bg-orange-500/10 text-orange-500">
            <FileText className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-medium">Nota sobre Artículos</h4>
            <p className="text-sm text-muted-foreground">
              Los artículos siguen un flujo similar pero sin necesidad de subir archivos de video o miniaturas.
              El proceso se centra en la optimización del contenido y las revisiones del equipo.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
