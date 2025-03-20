import React from 'react';
import { ApiVideo, useVideos } from "@/hooks/useVideos";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUser } from "@/hooks/use-user";
import { ArrowDown, ArrowUp, Eye, Trash2, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/date";
import { MascotLoader } from "@/components/ui/mascot-loader";
import { VideoDetailDialog } from "./VideoDetailDialog";
import { NewVideoDialog } from "./NewVideoDialog";
import { VideoFilters } from "./components/VideoFilters";
import { VideoPaginationControls } from "./components/VideoPaginationControls";
import { Link } from "wouter";
import { type DateRange } from "react-day-picker";
import { User } from "@db/schema";

// Estados visibles por rol
const VISIBLE_STATES: Record<User['role'], string[]> = {
  optimizer: [
    "pending",
    "in_progress",
    "optimize_review",
    "title_corrections",
    "en_revision",
  ],
  youtuber: ["video_disponible", "asignado", "youtube_ready", "completed"],
  reviewer: [
    "optimize_review",
    "title_corrections",
    "upload_review", 
    "completed",
    "en_revision",
  ],
  content_reviewer: [
    "content_review",
    "optimize_review",
    "title_corrections"
  ],
  media_reviewer: [
    "media_review",
    "upload_review"
  ],
  admin: [
    "pending",
    "in_progress",
    "optimize_review", 
    "title_corrections",
    "upload_review",
    "media_corrections",
    "review",
    "youtube_ready",
    "completed",
    "en_revision",
  ],
};

export default function VideosPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const {
    videos,
    isLoading,
    sort,
    setSort,
    pagination,
    page,
    setPage,
    limit,
    setLimit,
    searchTerm,
    setSearchTerm,
    status,
    setStatus,
    dateRange,
    setDateRange,
    assignedTo,
    setAssignedTo,
    projectId,
    setProjectId,
    selectedVideo,
    setSelectedVideo,
    newVideoDialogOpen,
    setNewVideoDialogOpen,
    showFilters,
    setShowFilters,
    deleteVideo,
    getStatusBadgeColor,
    getStatusLabel
  } = useVideos();

  // Handle column sorting
  const handleSort = (field: string) => {
    setSort((prev) => {
      if (prev?.field === field) {
        return {
          field,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return {
        field,
        direction: "asc",
      };
    });
  };

  function renderSortIcon(field: string) {
    if (sort?.field !== field) return null;
    return sort.direction === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  }

  // Mostrar loader mientras carga el usuario
  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <MascotLoader animation="wave" text="Cargando usuario..." />
      </div>
    );
  }

  // Verificar que hay un usuario
  if (!user) return null;

  // Mostrar loader mientras cargan los videos
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <MascotLoader animation="thinking" text="Cargando videos..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header y controles */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Videos ({pagination.totalVideos})</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          {user.role === "admin" && (
            <Button size="sm" onClick={() => setNewVideoDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Video
            </Button>
          )}
        </div>
      </div>

      {/* Vista de tabla */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer hover:bg-muted/60" onClick={() => handleSort("id")}>
                <div className="flex items-center gap-2">
                  ID
                  {renderSortIcon("id")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/60" onClick={() => handleSort("seriesNumber")}>
                <div className="flex items-center gap-2">
                  Serie
                  {renderSortIcon("seriesNumber")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/60" onClick={() => handleSort("title")}>
                <div className="flex items-center gap-2">
                  Título
                  {renderSortIcon("title")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/60" onClick={() => handleSort("status")}>
                <div className="flex items-center gap-2">
                  Estado
                  {renderSortIcon("status")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/60" onClick={() => handleSort("updatedAt")}>
                <div className="flex items-center gap-2">
                  Actualización
                  {renderSortIcon("updatedAt")}
                </div>
              </TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {videos.map((video) => (
              <TableRow key={video.id}>
                <TableCell>{video.id}</TableCell>
                <TableCell>{video.seriesNumber || "-"}</TableCell>
                <TableCell>{video.title}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={cn(getStatusBadgeColor(video.status))}>
                    {getStatusLabel(user.role, video)}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(video.updatedAt)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedVideo(video)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {user.role === "admin" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteVideo({
                          videoId: video.id,
                          projectId: video.projectId
                        })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <VideoPaginationControls
        currentPage={page}
        totalPages={pagination.totalPages}
        setCurrentPage={setPage}
        itemsPerPage={limit}
        setItemsPerPage={setLimit}
      />

      {/* Modales */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(undefined)}>
        {selectedVideo && (
          <VideoDetailDialog video={selectedVideo} onUpdate={() => {}} />
        )}
      </Dialog>

      <Dialog open={newVideoDialogOpen} onOpenChange={setNewVideoDialogOpen}>
        <NewVideoDialog />
      </Dialog>

      {/* Filtros */}
      {showFilters && (
        <VideoFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          status={status}
          onStatusChange={setStatus}
          date={dateRange}
          onDateChange={setDateRange}
          assignedTo={assignedTo}
          onAssignedToChange={setAssignedTo}
          projectId={projectId}
          onProjectChange={setProjectId}
          showFilters={showFilters}
          visibleStates={user ? VISIBLE_STATES[user.role] : []}
        />
      )}
    </div>
  );
}