import { Youtube } from "lucide-react";
import { motion } from "framer-motion";
import { useTitulin } from "./hooks/useTitulin";
import { VideoStats } from "./components/VideoStats";
import { SearchBar } from "./components/SearchBar";
import { VowelFilter } from "./components/VowelFilter";
import { TableActions } from "./components/TableActions";
import { VideoTable } from "./components/VideoTable";
import { PaginationControls } from "./components/PaginationControls";
import { SendToOptimizeDialog } from "./components/SendToOptimizeDialog";

export default function TitulinPage() {
  const {
    // Data
    searchValue,
    setSearchValue,
    titleFilter,
    setTitleFilter,
    channelFilter,
    setChannelFilter,
    selectedVideo,
    setSelectedVideo,
    currentPage,
    setCurrentPage,
    selectedVowel,
    setSelectedVowel,
    handleClearVowelFilter,
    vowels,
    vowelStats,
    videos,
    channels,
    pagination,
    totalVideos,
    viewsCount,
    likesCount,
    isSearching,
    isFetching,
    isDownloading,
    getLastUpdateInfo,
    getChannelName,
    handleDownloadCSV
  } = useTitulin();

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <Youtube className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Videos de YouTube</h1>
          </div>

          <VideoStats 
            totalVideos={totalVideos}
            viewsCount={viewsCount}
            likesCount={likesCount}
            lastUpdateInfo={getLastUpdateInfo()}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
            <div className="relative flex-1">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  {/* Barra de búsqueda con autocompletado */}
                  <SearchBar 
                    searchValue={searchValue}
                    setSearchValue={setSearchValue}
                    setTitleFilter={setTitleFilter}
                    setCurrentPage={setCurrentPage}
                    setSelectedVowel={setSelectedVowel}
                    titleFilter={titleFilter}
                    selectedVowel={selectedVowel}
                    isSearching={isSearching}
                    isFetching={isFetching}
                    handleClearVowelFilter={handleClearVowelFilter}
                  />

                  {/* Filtro por vocales (mantenemos para compatibilidad y casos de uso específicos) */}
                  {!titleFilter && (
                    <VowelFilter
                      vowels={vowels}
                      selectedVowel={selectedVowel}
                      setSelectedVowel={setSelectedVowel}
                      setTitleFilter={setTitleFilter}
                      setSearchValue={setSearchValue}
                      setCurrentPage={setCurrentPage}
                      handleClearVowelFilter={handleClearVowelFilter}
                      isSearching={isSearching}
                      isFetching={isFetching}
                      vowelStats={vowelStats}
                      totalVideos={totalVideos}
                    />
                  )}
                </div>

                {/* Selector de canal y botón de exportar */}
                <TableActions
                  channelFilter={channelFilter}
                  setChannelFilter={setChannelFilter}
                  setCurrentPage={setCurrentPage}
                  channels={channels}
                  handleDownloadCSV={handleDownloadCSV}
                  isDownloading={isDownloading}
                />
              </div>
            </div>
          </div>

          {/* Tabla de videos */}
          <VideoTable
            videos={videos}
            setSelectedVideo={setSelectedVideo}
            getChannelName={getChannelName}
          />

          {/* Paginación */}
          <PaginationControls
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            setCurrentPage={setCurrentPage}
          />
        </motion.div>

        {/* Modal para enviar video a optimización */}
        {selectedVideo && (
          <SendToOptimizeDialog
            video={selectedVideo}
            open={!!selectedVideo}
            onOpenChange={(open) => {
              if (!open) setSelectedVideo(null);
            }}
          />
        )}
      </div>
    </div>
  );
}