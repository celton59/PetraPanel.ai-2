import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  url?: string | null;
  size?: "sm" | "lg";
  editable?: boolean;
  onUploadComplete?: () => void;
}

export function AvatarUpload({ 
  url, 
  size = "sm",
  editable = true,
  onUploadComplete 
}: AvatarUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  async function uploadAvatar (file: File) {
    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }

      const data = await response.json();
      onUploadComplete?.();

      toast({
        title: "Avatar actualizado",
        description: "Tu foto de perfil se ha actualizado correctamente.",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        variant: "destructive",
        title: "Error al subir avatar",
        description: "No se pudo actualizar tu foto de perfil. Por favor, intenta de nuevo.",
      });
    } finally {
      setUploading(false);
    }
  };


  async function handleFileChange (e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
    }
  };

  return (
    <div className="relative inline-block">
      <Avatar className={cn(
        size === "sm" ? "h-16 w-16" : "h-32 w-32",
        "ring-4 ring-background"
      )}>
        <AvatarImage src={url || undefined} />
        <AvatarFallback>
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <User className={size === "sm" ? "h-8 w-8" : "h-12 w-12"} />
          )}
        </AvatarFallback>
      </Avatar>

      {editable && (
        <>
          <Button
            variant="outline"
            className="absolute -bottom-2 -right-2 rounded-full h-10 w-10"
            onClick={() => document.getElementById("avatar")?.click()}
          >
            <Camera className="h-4 w-4" />
          </Button>
          <input
            type="file"
            id="avatar"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </>
      )}
    </div>
  );
}