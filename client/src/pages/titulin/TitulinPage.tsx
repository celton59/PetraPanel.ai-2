import { Youtube } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { VideoStats } from "./components/VideoStats";
import { SearchBar } from "./components/SearchBar";
import { TableActions } from "./components/TableActions";
import { VideoTable } from "./components/VideoTable";
import { PaginationControls } from "./components/PaginationControls";
import { SendToOptimizeDialog } from "./components/SendToOptimizeDialog";
import { VideoAnalysisDialog } from "./components/VideoAnalysisDialog";
import { TitleComparisonDialog } from "./configuration/TitleComparisonDialog";
import { format, parseISO, isValid, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { SortingState } from "@tanstack/react-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import TitulinConfiguration from "./configuration/TitulinConfiguration";
import { TitulinVideo, useTitulin } from "@/hooks/useTitulin";

function VideoOverviewTab({ children }: { children: React.ReactNode }) {
  return <div className="space-y-8">{children}</div>;
}

export default function TitulinPage() {
  // Estados de la página
  const [searchValue, setSearchValue] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<TitulinVideo | null>(null);
  const [analysisVideo, setAnalysisVideo] = useState<TitulinVideo | null>(null);
  const [showComparisonDialog, setShowComparisonDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [onlyEvergreen, setOnlyEvergreen] = useState(false);
  const [onlyAnalyzed, setOnlyAnalyzed] = useState(false);
  const [currentTab, setCurrentTab] = useState("overview");

  const { setTitleFilter, channelFilter, setChannelFilter, videos,
    channels, refetch, pagination, totalVideos, viewsCount, likesCount,
    handleDownloadCSV, isDownloading, isFetching, isLoading } = useTitulin()


  // Efecto para gestionar la búsqueda
  useEffect(() => {
    const timerId = setTimeout(() => {
      setTitleFilter(searchValue.trim());
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timerId);
  }, [searchValue]);

  // Obtener el queryClient para poder usarlo más tarde
  const queryClient = useQueryClient();

  // Obtener estadísticas
  const { data: statsData } = useQuery({
    queryKey: ["youtube-videos-stats"],
    queryFn: async () => {
      const response = await axios.get("/api/titulin/videos/stats");
      return response.data;
    },
  });

  // Función para formatear fechas
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return "-";
      return format(date, "PPp", { locale: es });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "-";
    }
  };

  // Obtener la información de la última actualización
  const getLastUpdateInfo = () => {
    if (!channels || channels.length === 0) return "No hay canales";

    if (channelFilter !== "all") {
      const selectedChannel = channels.find(c => c.channelId === channelFilter);
      // Obtener lastVideoFetch con cualquiera de los dos formatos posibles
      const lastFetch = selectedChannel?.lastVideoFetch

      if (!lastFetch) return "Sin datos de actualización";

      try {
        const date = parseISO(lastFetch);
        return `Hace ${formatDistanceToNow(date, { locale: es })}`;
      } catch (error) {
        return "Fecha inválida";
      }
    }

    const lastUpdate = channels.reduce((latest, channel) => {
      // Obtener lastVideoFetch con cualquiera de los dos formatos posibles
      const lastFetch = channel.lastVideoFetch

      if (!lastFetch) return latest;
      if (!latest) return lastFetch;
      return lastFetch > latest ? lastFetch : latest;
    }, null as string | null);

    if (!lastUpdate) return "No hay datos";

    try {
      const date = parseISO(lastUpdate);
      return `Hace ${formatDistanceToNow(date, { locale: es })}`;
    } catch (error) {
      return "Fecha inválida";
    }
  };

  // Obtener el nombre de un canal
  const getChannelName = (channelId: string) => {
    const channel = channels?.find(c => c.channelId === channelId);
    return channel?.name || channelId;
  };

  // Función para refrescar datos
  const refreshData = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast.success("Datos actualizados correctamente");
  };

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Youtube className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Titulín</h1>
            </div>
          </div>
        </motion.div>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visión General</TabsTrigger>
            <TabsTrigger value="config">Configuración</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <VideoOverviewTab>
              <VideoStats
                totalVideos={totalVideos}
                viewsCount={viewsCount}
                likesCount={likesCount}
                lastUpdateInfo={getLastUpdateInfo()}
              />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 gap-6">
                  <div className="w-full">
                    <SearchBar
                      searchValue={searchValue}
                      setSearchValue={setSearchValue}
                      setTitleFilter={setTitleFilter}
                      setCurrentPage={setCurrentPage}
                      isFetching={isFetching}
                    />
                  </div>

                  <div className="w-full">
                    <TableActions
                      channelFilter={channelFilter}
                      setChannelFilter={setChannelFilter}
                      setCurrentPage={setCurrentPage}
                      channels={channels}
                      onlyEvergreen={onlyEvergreen}
                      setOnlyEvergreen={setOnlyEvergreen}
                      onlyAnalyzed={onlyAnalyzed}
                      setOnlyAnalyzed={setOnlyAnalyzed}
                      refreshData={refreshData}
                      isRefreshing={isRefreshing}
                    />
                  </div>
                </div>

                {isLoading ? (
                  <div className="text-center py-10">
                    <div className="animate-spin h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Cargando videos...</p>
                  </div>
                ) : (
                  <div>
                    <VideoTable
                      videos={videos}
                      setSelectedVideo={setSelectedVideo}
                      setAnalysisVideo={setAnalysisVideo}
                      getChannelName={getChannelName}
                      isLoading={isFetching}
                      handleDownloadCSV={handleDownloadCSV}
                      isDownloading={isDownloading}
                    />
                    <div className="flex justify-between items-center mt-4 px-2">
                      <div className="text-sm text-muted-foreground">
                        {pagination.total > 0 ? (
                          <span>
                            Mostrando {Math.min((currentPage - 1) * pageSize + 1, pagination.total)} - {Math.min(currentPage * pageSize, pagination.total)} de {pagination.total} videos
                          </span>
                        ) : (
                          <span>No hay videos que coincidan con los filtros</span>
                        )}
                      </div>

                      <PaginationControls
                        currentPage={currentPage}
                        totalPages={pagination.totalPages}
                        setCurrentPage={setCurrentPage}
                      />
                    </div>
                  </div>
                )}


                {selectedVideo && (
                  <SendToOptimizeDialog
                    video={selectedVideo}
                    open={!!selectedVideo}
                    onOpenChange={(open) => {
                      if (!open) setSelectedVideo(null);
                    }}
                  />
                )}

                {analysisVideo && (
                  <VideoAnalysisDialog
                    video={analysisVideo}
                    open={!!analysisVideo}
                    onOpenChange={(open) => {
                      if (!open) setAnalysisVideo(null);
                    }}
                    onAnalysisComplete={() => {
                      window.setTimeout(() => {
                        queryClient.invalidateQueries({ queryKey: ["youtube-videos"] });
                      }, 500);
                    }}
                  />
                )}

                {showComparisonDialog && (
                  <TitleComparisonDialog
                    open={showComparisonDialog}
                    onOpenChange={setShowComparisonDialog}
                  />
                )}
              </motion.div>
            </VideoOverviewTab>
          </TabsContent>

          <TabsContent value="config">
            <TitulinConfiguration />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}