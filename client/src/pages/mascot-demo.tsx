import React from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MascotLoader, MascotAnimationType } from "@/components/ui/mascot-loader";
import { Layout } from "@/components/layout/Layout";

export default function MascotDemo() {
  const animations: MascotAnimationType[] = ['dance', 'jump', 'spin', 'wave', 'thinking'];
  const sizes = ['sm', 'md', 'lg', 'xl'] as const;
  const texts = [
    'Cargando...',
    'Procesando tus videos...',
    'Analizando contenido...',
    'Optimizando recursos...',
    '¡Casi listo!'
  ];

  return (
    <Layout>
      <div className="container mx-auto py-10">
        <div className="flex flex-col space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Demostración de Mascota Animada</h1>
            <p className="text-muted-foreground">Diferentes variantes de animaciones para estados de carga</p>
          </div>

          <Tabs defaultValue="variants">
            <TabsList>
              <TabsTrigger value="variants">Por Tipo de Animación</TabsTrigger>
              <TabsTrigger value="sizes">Por Tamaños</TabsTrigger>
              <TabsTrigger value="messages">Diferentes Mensajes</TabsTrigger>
            </TabsList>

            <TabsContent value="variants">
              <Card>
                <CardHeader>
                  <CardTitle>Variantes de animación</CardTitle>
                  <CardDescription>
                    Distintos tipos de animaciones disponibles para la mascota
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {animations.map((animation) => (
                      <div key={animation} className="flex flex-col items-center">
                        <MascotLoader 
                          animation={animation} 
                          text={`Animación: ${animation}`}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sizes">
              <Card>
                <CardHeader>
                  <CardTitle>Tamaños disponibles</CardTitle>
                  <CardDescription>
                    La mascota se puede adaptar a diferentes tamaños según el contexto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {sizes.map((size) => (
                      <div key={size} className="flex flex-col items-center justify-start">
                        <MascotLoader 
                          animation="dance" 
                          size={size}
                          text={`Tamaño: ${size}`}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages">
              <Card>
                <CardHeader>
                  <CardTitle>Mensajes contextuales</CardTitle>
                  <CardDescription>
                    La mascota puede mostrar diferentes mensajes según la acción
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {texts.map((text, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <MascotLoader 
                          animation={animations[index % animations.length]} 
                          text={text}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>Implementación en la aplicación</CardTitle>
              <CardDescription>
                Cómo usar el componente MascotLoader en diferentes partes de la app
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h3 className="font-semibold">Uso básico:</h3>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                  <code>{`<MascotLoader 
  animation="dance" 
  text="Cargando..." 
/>`}</code>
                </pre>

                <h3 className="font-semibold mt-4">Personalización:</h3>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                  <code>{`<MascotLoader 
  animation="jump" 
  size="lg" 
  text="Procesando video..." 
  className="mb-4" 
/>`}</code>
                </pre>

                <div className="p-4 border border-primary/20 rounded-md mt-6 bg-card">
                  <h3 className="text-sm font-medium mb-2">Recomendaciones de uso:</h3>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li>Usa <code className="text-xs bg-primary/10 px-1 rounded">dance</code> o <code className="text-xs bg-primary/10 px-1 rounded">jump</code> para cargas generales</li>
                    <li>Usa <code className="text-xs bg-primary/10 px-1 rounded">thinking</code> para procesos de análisis o IA</li>
                    <li>Usa <code className="text-xs bg-primary/10 px-1 rounded">wave</code> para mensajes de bienvenida o finalización</li>
                    <li>Usa <code className="text-xs bg-primary/10 px-1 rounded">spin</code> para indicar procesos en segundo plano</li>
                    <li>Ajusta el tamaño según el espacio disponible en la interfaz</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}