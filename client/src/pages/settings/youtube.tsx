import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, Loader2, Youtube, Link2, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

interface AuthorizedChannel {
  id: string;
  title: string;
  customUrl?: string;
  thumbnailUrl?: string;
  subscriberCount?: number;
  videoCount?: number;
  isConnected?: boolean;
}

export default function YouTubeSettings() {
  const [location] = useLocation();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [newChannelUrl, setNewChannelUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  // Obtener los parámetros de URL para mostrar mensajes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get("success") === "true") {
      setShowSuccess(true);
      toast.success("Cuenta de YouTube conectada correctamente");
      
      // Limpiar los parámetros de la URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get("error")) {
      setShowError(true);
      const error = params.get("error");
      
      if (error === "auth_failed") {
        setErrorMessage("Error al autenticar con YouTube. Inténtalo de nuevo.");
      } else if (error === "no_code") {
        setErrorMessage("No se recibió código de autorización. Inténtalo de nuevo.");
      } else {
        setErrorMessage("Error al conectar con YouTube. Inténtalo de nuevo.");
      }
      
      // Limpiar los parámetros de la URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location]);

  // Consulta para obtener los canales autorizados
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["authorized-youtube-channels"],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/youtube/authorized-channels");
        if (!response.data.success) {
          throw new Error(response.data.message || "Error al obtener canales");
        }
        return response.data.data as AuthorizedChannel[];
      } catch (error) {
        console.error("Error fetching authorized channels:", error);
        throw error;
      }
    }
  });

  // Función para autorizar con YouTube
  const authorizeYouTube = () => {
    setIsAuthorizing(true);
    window.location.href = "/api/youtube/authorize";
  };

  // Función para conectar un canal manualmente
  const connectChannel = async () => {
    if (!newChannelUrl.trim()) {
      toast.error("Por favor ingresa la URL del canal");
      return;
    }

    setIsConnecting(true);
    try {
      const response = await axios.post("/api/youtube/connect-channel", { url: newChannelUrl });
      if (response.data.success) {
        toast.success("Canal conectado correctamente");
        setNewChannelUrl("");
        refetch();
      } else {
        toast.error(response.data.message || "Error al conectar el canal");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al conectar el canal");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Configuración de YouTube</h1>
      
      {showSuccess && (
        <Alert className="mb-6" variant="success">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Conexión exitosa</AlertTitle>
          <AlertDescription>
            Tu cuenta de YouTube ha sido conectada correctamente.
          </AlertDescription>
        </Alert>
      )}
      
      {showError && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error de conexión</AlertTitle>
          <AlertDescription>
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="channels" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="channels">Canales Conectados</TabsTrigger>
          <TabsTrigger value="connect">Conectar Canal</TabsTrigger>
        </TabsList>
        
        <TabsContent value="channels">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Canales de YouTube Autorizados</CardTitle>
                <CardDescription>
                  Estos son los canales a los que tienes acceso para publicar videos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-3 text-muted-foreground">Cargando canales...</span>
                  </div>
                ) : isError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      No se pudieron cargar los canales. Inténtalo de nuevo.
                    </AlertDescription>
                  </Alert>
                ) : data && data.length > 0 ? (
                  <div className="grid gap-4">
                    {data.map(channel => (
                      <div 
                        key={channel.id} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center">
                          {channel.thumbnailUrl ? (
                            <img 
                              src={channel.thumbnailUrl} 
                              alt={channel.title} 
                              className="w-10 h-10 rounded-full mr-3 object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                              <Youtube className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-medium">{channel.title}</h3>
                            {channel.customUrl && (
                              <p className="text-sm text-muted-foreground">{channel.customUrl}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          {channel.subscriberCount && (
                            <span className="mr-3">{new Intl.NumberFormat().format(channel.subscriberCount)} suscriptores</span>
                          )}
                          {channel.videoCount && (
                            <span>{new Intl.NumberFormat().format(channel.videoCount)} videos</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Youtube className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No hay canales conectados</h3>
                    <p className="text-muted-foreground mb-6">
                      Autoriza tu cuenta de YouTube o conecta un canal manualmente
                    </p>
                    <Button onClick={authorizeYouTube} disabled={isAuthorizing}>
                      {isAuthorizing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Autorizando...
                        </>
                      ) : (
                        <>
                          <Youtube className="mr-2 h-4 w-4" />
                          Autorizar YouTube
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
              {data && data.length > 0 && (
                <CardFooter className="justify-between">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => refetch()}
                  >
                    Actualizar
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={authorizeYouTube}
                    disabled={isAuthorizing}
                  >
                    {isAuthorizing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Autorizando...
                      </>
                    ) : (
                      <>
                        <Youtube className="mr-2 h-4 w-4" />
                        Autorizar más canales
                      </>
                    )}
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="connect">
          <Card>
            <CardHeader>
              <CardTitle>Conectar canal de YouTube</CardTitle>
              <CardDescription>
                Conecta tu canal de YouTube de forma manual o autoriza tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Conectar mediante URL</h3>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newChannelUrl}
                      onChange={(e) => setNewChannelUrl(e.target.value)}
                      placeholder="https://www.youtube.com/c/MiCanal"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <Button 
                      onClick={connectChannel}
                      disabled={isConnecting || !newChannelUrl.trim()}
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Conectando...
                        </>
                      ) : (
                        <>
                          <Link2 className="mr-2 h-4 w-4" />
                          Conectar
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Ejemplos de URLs: <code>https://www.youtube.com/c/MiCanal</code> o <code>https://youtube.com/@usuario</code>
                  </p>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-3">Conectar mediante OAuth</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Autoriza directamente tu cuenta de Google para acceder a todos tus canales de YouTube
                  </p>
                  <Button 
                    onClick={authorizeYouTube} 
                    disabled={isAuthorizing}
                  >
                    {isAuthorizing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Autorizando...
                      </>
                    ) : (
                      <>
                        <Youtube className="mr-2 h-4 w-4" />
                        Autorizar YouTube
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}