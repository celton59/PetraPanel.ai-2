import { useState } from "react";
import { useSecretCode, useEasterEggs, EasterEggOptions } from "@/hooks/use-easter-eggs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { EasterEggType } from "@/components/ui/easter-egg";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { MascotLoader } from "@/components/ui/mascot-loader";
import { 
  Sparkles, 
  Music, 
  Rainbow, 
  Rocket, 
  Key, 
  PartyPopper,
  RefreshCw,
  Info,
  Copy,
  Lock
} from "lucide-react";

export default function EasterEggsDemo() {
  const { showEasterEgg, seenEasterEggs, resetSeenEasterEggs } = useEasterEggs();
  const [activeTab, setActiveTab] = useState<string>("demo");
  
  // Estado para la configuración del easter egg
  const [easterEggConfig, setEasterEggConfig] = useState<EasterEggOptions>({
    type: "confetti",
    message: "¡Esto es un easter egg!",
    duration: 5000,
    position: "center",
    showOnce: false,
    id: "custom-easter-egg"
  });
  
  // Función para mostrar un easter egg
  const triggerEasterEgg = (type: EasterEggType, message?: string) => {
    showEasterEgg({
      type,
      message: message || `¡Easter egg tipo ${type}!`,
      duration: 5000,
      position: "center"
    });
  };
  
  // Función para mostrar un easter egg personalizado
  const triggerCustomEasterEgg = () => {
    showEasterEgg(easterEggConfig);
    toast.success("Easter egg activado", {
      description: `Tipo: ${easterEggConfig.type}`,
    });
  };
  
  // Configurar secret codes para demostración
  useSecretCode("petra", () => {
    showEasterEgg({
      type: "secret",
      message: "¡Descubriste el código secreto 'petra'!",
      duration: 5000,
      position: "center"
    });
    
    toast.success("¡Código secreto activado!", {
      description: "Has ingresado 'petra' en tu teclado"
    });
  });
  
  useSecretCode("fiesta", () => {
    showEasterEgg({
      type: "celebration",
      message: "¡La fiesta ha comenzado!",
      duration: 8000
    });
  });
  
  // Obtener el ícono para cada tipo de easter egg
  const getEasterEggIcon = (type: EasterEggType) => {
    switch (type) {
      case "confetti":
        return <Sparkles className="h-5 w-5" />;
      case "dance":
        return <Music className="h-5 w-5" />;
      case "rainbow":
        return <Rainbow className="h-5 w-5" />;
      case "rocket":
        return <Rocket className="h-5 w-5" />;
      case "secret":
        return <Key className="h-5 w-5" />;
      case "celebration":
        return <PartyPopper className="h-5 w-5" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };
  
  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Easter Eggs Interactivos</h1>
        <p className="text-muted-foreground">
          Explora y prueba las animaciones sorpresa que hacen más divertida la experiencia de PetraPanel
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="demo" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Galería de Easter Eggs
              </TabsTrigger>
              <TabsTrigger value="custom" className="flex items-center gap-2">
                <Rainbow className="h-4 w-4" />
                Personalizar Easter Egg
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="demo">
              <Card>
                <CardHeader>
                  <CardTitle>Prueba los Easter Eggs</CardTitle>
                  <CardDescription>
                    Haz clic en los botones para desencadenar diferentes tipos de easter eggs
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(["confetti", "dance", "rainbow", "rocket", "secret", "celebration"] as EasterEggType[]).map((type) => (
                      <Button
                        key={type}
                        variant="outline"
                        className="h-24 flex flex-col gap-2 justify-center items-center"
                        onClick={() => triggerEasterEgg(type)}
                      >
                        <div className="bg-primary/10 p-2 rounded-full">
                          {getEasterEggIcon(type)}
                        </div>
                        <span className="capitalize">{type}</span>
                      </Button>
                    ))}
                  </div>
                  
                  <div className="mt-8 bg-muted/30 p-4 rounded-lg">
                    <h3 className="text-lg font-medium flex items-center gap-2 mb-3">
                      <Lock className="h-5 w-5 text-primary" />
                      Códigos Secretos
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Prueba escribir estos códigos secretos en tu teclado (en cualquier parte de la página):
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between py-2 px-3 bg-background rounded border">
                        <code className="font-mono">petra</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1"
                          onClick={() => {
                            navigator.clipboard.writeText("petra");
                            toast.success("Copiado al portapapeles");
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span className="text-xs">Copiar</span>
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between py-2 px-3 bg-background rounded border">
                        <code className="font-mono">fiesta</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1"
                          onClick={() => {
                            navigator.clipboard.writeText("fiesta");
                            toast.success("Copiado al portapapeles");
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span className="text-xs">Copiar</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="custom">
              <Card>
                <CardHeader>
                  <CardTitle>Personaliza tu Easter Egg</CardTitle>
                  <CardDescription>
                    Configura y muestra un easter egg con tus propios parámetros
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo de Easter Egg</Label>
                      <Select
                        value={easterEggConfig.type}
                        onValueChange={(value) => 
                          setEasterEggConfig({...easterEggConfig, type: value as EasterEggType})
                        }
                      >
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {(["confetti", "dance", "rainbow", "rocket", "secret", "celebration"] as EasterEggType[]).map((type) => (
                            <SelectItem key={type} value={type} className="capitalize">
                              <div className="flex items-center gap-2">
                                {getEasterEggIcon(type)}
                                <span>{type}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="position">Posición</Label>
                      <Select
                        value={easterEggConfig.position}
                        onValueChange={(value) => 
                          setEasterEggConfig({
                            ...easterEggConfig, 
                            position: value as "top" | "center" | "bottom" | "random"
                          })
                        }
                      >
                        <SelectTrigger id="position">
                          <SelectValue placeholder="Seleccionar posición" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top">Arriba</SelectItem>
                          <SelectItem value="center">Centro</SelectItem>
                          <SelectItem value="bottom">Abajo</SelectItem>
                          <SelectItem value="random">Aleatorio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message">Mensaje</Label>
                      <Textarea
                        id="message"
                        placeholder="Escribe un mensaje para el easter egg"
                        value={easterEggConfig.message}
                        onChange={(e) => 
                          setEasterEggConfig({...easterEggConfig, message: e.target.value})
                        }
                        className="resize-none"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duración (ms)</Label>
                      <Input
                        id="duration"
                        type="number"
                        placeholder="5000"
                        value={easterEggConfig.duration}
                        onChange={(e) => 
                          setEasterEggConfig({
                            ...easterEggConfig, 
                            duration: parseInt(e.target.value) || 5000
                          })
                        }
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="id">ID único</Label>
                      <Input
                        id="id"
                        placeholder="ID para easter egg de una sola vez"
                        value={easterEggConfig.id}
                        onChange={(e) => 
                          setEasterEggConfig({...easterEggConfig, id: e.target.value})
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between space-y-0 pt-8">
                      <div className="space-y-0.5">
                        <Label htmlFor="show-once">Mostrar una sola vez</Label>
                        <p className="text-sm text-muted-foreground">
                          Si se activa, este easter egg solo se mostrará una vez por usuario
                        </p>
                      </div>
                      <Switch
                        id="show-once"
                        checked={easterEggConfig.showOnce}
                        onCheckedChange={(checked) => 
                          setEasterEggConfig({...easterEggConfig, showOnce: checked})
                        }
                      />
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="gap-1.5"
                      onClick={resetSeenEasterEggs}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Reiniciar registro
                    </Button>
                    
                    <Badge variant="outline" className="text-xs">
                      {seenEasterEggs.length} easter eggs vistos
                    </Badge>
                  </div>
                  
                  <Button onClick={triggerCustomEasterEgg} className="gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    Probar Easter Egg
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Sobre los Easter Eggs
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Los Easter Eggs son sorpresas interactivas ocultas en la aplicación para mejorar la experiencia del usuario y añadir un toque de diversión.
              </p>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="font-medium">¿Cómo activar Easter Eggs?</h3>
                <p className="text-sm text-muted-foreground">
                  Hay varias formas de activar easter eggs en PetraPanel:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                  <li>Lograr hitos específicos en la aplicación</li>
                  <li>Escribir secuencias de teclas especiales</li>
                  <li>Realizar acciones poco comunes o específicas</li>
                  <li>Encontrar áreas interactivas ocultas en la interfaz</li>
                </ul>
              </div>
              
              <Separator />
              
              <div className="rounded-md bg-primary/10 p-4">
                <div className="flex justify-center mb-4">
                  <MascotLoader animation="wave" size="md" text="" />
                </div>
                <p className="text-sm text-center">
                  ¡Explora la aplicación para descubrir todos los easter eggs ocultos!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}