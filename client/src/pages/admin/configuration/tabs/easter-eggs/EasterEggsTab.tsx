import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Sparkles, 
  ExternalLink, 
  Settings, 
  Code, 
  Info, 
  PlayCircle, 
  Lightbulb,
  ArrowRight
} from "lucide-react";
import { useState } from "react";
import { useEasterEggs } from "@/hooks/use-easter-eggs";
import { toast } from "sonner";

/**
 * Tab de configuración de Easter Eggs
 */
export function EasterEggsTab() {
  const [activeTab, setActiveTab] = useState("overview");
  const { showEasterEgg, seenEasterEggs, resetSeenEasterEggs } = useEasterEggs();
  
  const handleShowEasterEgg = (type: "confetti" | "dance" | "rainbow" | "rocket" | "secret" | "celebration") => {
    showEasterEgg({
      type,
      message: `¡Esto es un easter egg tipo ${type}!`,
      duration: 3000
    });
    
    toast.success("Easter egg activado", {
      description: `Has activado un easter egg de tipo: ${type}`
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-2xl font-medium tracking-tight">Easter Eggs</h3>
          <p className="text-sm text-muted-foreground">
            Gestiona y personaliza las interacciones sorpresa para los usuarios
          </p>
        </div>
        
        <Link href="/easter-eggs-demo">
          <Button variant="outline" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            <span>Ver demostración</span>
          </Button>
        </Link>
      </div>
      
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="w-full mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Información General
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4" />
            Pruebas
          </TabsTrigger>
          <TabsTrigger value="secret-codes" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Códigos Secretos
          </TabsTrigger>
        </TabsList>
        
        {/* Tab Información General */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Sobre los Easter Eggs
              </CardTitle>
              <CardDescription>
                Características interactivas ocultas que mejoran la experiencia del usuario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                Los Easter Eggs son pequeñas sorpresas o funcionalidades ocultas que se revelan cuando los usuarios 
                realizan acciones específicas, como ingresar códigos secretos o alcanzar ciertos hitos.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Card className="bg-muted/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Diversión</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs">
                      Añade un elemento divertido y sorprendente para mejorar la experiencia de usuario
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs">
                      Incrementa la interacción y retención de usuarios a través de descubrimientos
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Distintivo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs">
                      Diferencia tu aplicación con elementos únicos y memorables
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-medium">Estadísticas de Easter Eggs</h4>
                    <p className="text-xs text-muted-foreground mt-1">Seguimiento de descubrimientos por usuarios</p>
                  </div>
                  <Badge variant="outline" className="h-6 text-xs">
                    {seenEasterEggs.length} descubiertos
                  </Badge>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={resetSeenEasterEggs}
                >
                  Reiniciar estadísticas
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab Configuración */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuración General</CardTitle>
              <CardDescription>
                Personaliza cómo se comportan los easter eggs en la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Easter Eggs Habilitados</label>
                  <p className="text-xs text-muted-foreground">
                    Activa o desactiva todas las interacciones especiales
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Animaciones Reducidas</label>
                  <p className="text-xs text-muted-foreground">
                    Simplifica las animaciones para mejorar la accesibilidad
                  </p>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Guardar Historial</label>
                  <p className="text-xs text-muted-foreground">
                    Registra qué easter eggs ha descubierto cada usuario
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium">Duración Predeterminada (ms)</label>
                <Input type="number" placeholder="5000" defaultValue="5000" />
                <p className="text-xs text-muted-foreground">
                  Tiempo que se muestran los easter eggs por defecto
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab de Pruebas */}
        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Prueba de Easter Eggs</CardTitle>
              <CardDescription>
                Visualiza y prueba los diferentes tipos de easter eggs disponibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Card className="border border-muted-foreground/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Confeti</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-xs text-muted-foreground">Lluvia de confeti colorido</p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleShowEasterEgg("confetti")}
                    >
                      Probar
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="border border-muted-foreground/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Baile</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-xs text-muted-foreground">Animación de baile divertida</p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleShowEasterEgg("dance")}
                    >
                      Probar
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="border border-muted-foreground/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Arcoíris</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-xs text-muted-foreground">Efecto de texto arcoíris</p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleShowEasterEgg("rainbow")}
                    >
                      Probar
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="border border-muted-foreground/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Cohete</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-xs text-muted-foreground">Animación de lanzamiento</p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleShowEasterEgg("rocket")}
                    >
                      Probar
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="border border-muted-foreground/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Secreto</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-xs text-muted-foreground">Efecto de descubrimiento secreto</p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleShowEasterEgg("secret")}
                    >
                      Probar
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="border border-muted-foreground/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Celebración</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-xs text-muted-foreground">Fiesta animada con elementos festivos</p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleShowEasterEgg("celebration")}
                    >
                      Probar
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button 
                variant="outline" 
                asChild 
                className="gap-2"
              >
                <Link href="/easter-eggs-demo">
                  <Sparkles className="h-4 w-4" />
                  <span>Ir a página completa de demostración</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Tab de Códigos Secretos */}
        <TabsContent value="secret-codes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Códigos Secretos</CardTitle>
              <CardDescription>
                Gestiona los códigos secretos que los usuarios pueden ingresar para activar easter eggs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border rounded-md p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium">petra</h4>
                        <Badge>Activo</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Muestra un easter egg secreto con la mascota de PetraPanel
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
                
                <div className="border rounded-md p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium">fiesta</h4>
                        <Badge>Activo</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Desencadena una celebración con animaciones festivas
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
                
                <div className="border rounded-md p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium">rainbow</h4>
                        <Badge variant="outline">Inactivo</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Activa un efecto de arcoíris en la interfaz
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center mt-6">
                <Button variant="outline" className="gap-2">
                  <Lightbulb className="h-4 w-4" />
                  <span>Ver sugerencias de implementación</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}