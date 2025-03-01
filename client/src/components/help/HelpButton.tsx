import { useGuide } from "@/components/help/GuideContext";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

export function HelpButton() {
  const { openGuide } = useGuide();
  
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="hidden sm:flex relative"
      onClick={openGuide}
    >
      <HelpCircle className="h-5 w-5 text-muted-foreground" />
    </Button>
  );
}