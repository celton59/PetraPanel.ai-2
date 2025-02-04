
import { NewVideoDialog } from "@/components/video/NewVideoDialog";
import { useEffect } from "react";

export default function NewVideo() {
  // Auto-open dialog when page loads
  useEffect(() => {
    const dialogTrigger = document.querySelector("[data-new-video-trigger]") as HTMLButtonElement;
    if (dialogTrigger) {
      dialogTrigger.click();
    }
  }, []);

  return (
    <div className="container mx-auto max-w-[1200px] px-4 py-8">
      <div className="flex flex-col gap-2 mb-12">
        <h1 className="text-4xl font-bold">Nuevo Video</h1>
        <p className="text-muted-foreground text-lg">
          Crea un nuevo video para tu proyecto
        </p>
      </div>
      <NewVideoDialog autoOpen={true} />
    </div>
  );
}
