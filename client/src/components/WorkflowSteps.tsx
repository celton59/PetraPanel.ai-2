import { Card } from "@/components/ui/card";
import { VideoFlowDiagram } from "./video/VideoFlowDiagram";

export function WorkflowSteps() {
  const steps = [
    {
      title: "Pending",
      description: "Video nuevo esperando asignación",
      role: "Optimizer"
    },
    {
      title: "In Progress",
      description: "Optimización de título y contenido",
      role: "Optimizer"
    },
    {
      title: "Review",
      description: "Revisión por el equipo",
      role: "Reviewer"
    },
    {
      title: "Upload",
      description: "Preparación para YouTube",
      role: "Uploader"
    },
    {
      title: "Completed",
      description: "Publicado en YouTube",
      role: "Sistema"
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {steps.map((step, index) => (
          <Card key={index} className="p-4">
            <h3 className="font-semibold mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
            <p className="text-xs text-muted-foreground">Role: {step.role}</p>
          </Card>
        ))}
      </div>

      <VideoFlowDiagram />
    </div>
  );
}