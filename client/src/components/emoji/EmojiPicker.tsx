import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  maxLength: number;
  currentLength: number;
}

const EMOJIS = ["🎮", "🎯", "🎲", "🎪", "🎨", "🎭", "🎪", "🎢", "🎡", "🎠", "🎪", "🎭", "🎨", "🎯", "🎮", "🎲"];

export function EmojiPicker({
  isOpen,
  onClose,
  onEmojiSelect,
  maxLength,
  currentLength,
}: EmojiPickerProps) {
  const handleSelect = (emoji: string) => {
    if (currentLength + emoji.length <= maxLength) {
      onEmojiSelect(emoji);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Selecciona un Emoji</h2>
            <p className="text-sm text-muted-foreground">
              Caracteres disponibles: {maxLength - currentLength}
            </p>
          </div>
          <ScrollArea className="h-72">
            <div className="grid grid-cols-6 gap-2 p-4">
              {EMOJIS.map((emoji, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-10 w-10"
                  onClick={() => handleSelect(emoji)}
                  disabled={currentLength + emoji.length > maxLength}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
