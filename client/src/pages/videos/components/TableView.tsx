import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { getStatusBadgeColor, getStatusLabel } from "@/lib/status-labels";
import { ThumbnailPreview } from "@/components/common/ThumbnailPreview";
import { ApiVideo } from "@/types/api";
import { User } from "@/types/user";

interface TableViewProps {
  videos: ApiVideo[];
  filteredVideos: ApiVideo[];
  selectedVideos: number[];
  selectMode: boolean;
  toggleSelectVideo: (videoId: number) => void;
  toggleSelectAll: () => void;
  handleVideoClick: (video: ApiVideo) => void;
  canSeeVideoDetails: (video: ApiVideo) => boolean;
  deleteVideo: (params: { videoId: number; projectId: number }) => void;
  user: User;
  renderEmptyState: () => React.ReactNode;
}

export function TableView({
  videos,
  filteredVideos,
  selectedVideos,
  selectMode,
  toggleSelectVideo,
  toggleSelectAll,
  handleVideoClick,
  canSeeVideoDetails,
  deleteVideo,
  user,
  renderEmptyState
}: TableViewProps) {
  const [sortColumn, setSortColumn] = useState<string>("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Renderizar el ícono de ordenamiento
  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return null;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  };

  if (filteredVideos.length === 0) {
    return (
      <div className="flex justify-center mt-10">
        {renderEmptyState()}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            {/* Checkbox de selección para todos */}
            {user?.role === "admin" && selectMode && (
              <TableHead className="w-10">
                <Checkbox
                  checked={selectedVideos.length > 0 && selectedVideos.length === filteredVideos.length}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Seleccionar todos"
                />
              </TableHead>
            )}
            
            {/* Columna de miniatura */}
            <TableHead className="w-24">
              Miniatura
            </TableHead>
            
            {/* Columna de título */}
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort("title")}
            >
              <div className="flex items-center gap-1">
                Título
                {renderSortIcon("title")}
              </div>
            </TableHead>
            
            {/* Columna de estado */}
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort("status")}
            >
              <div className="flex items-center gap-1">
                Estado
                {renderSortIcon("status")}
              </div>
            </TableHead>
            
            {/* Columna de proyecto */}
            <TableHead className="hidden md:table-cell">
              Proyecto
            </TableHead>
            
            {/* Columna de asignado a */}
            <TableHead className="hidden lg:table-cell">
              Asignado a
            </TableHead>
            
            {/* Columna de última actualización */}
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort("updatedAt")}
            >
              <div className="flex items-center gap-1">
                Actualización
                {renderSortIcon("updatedAt")}
              </div>
            </TableHead>
            
            {/* Columna de acciones */}
            {user?.role === "admin" && !selectMode && (
              <TableHead className="w-10">
                Acciones
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredVideos.map((video) => (
            <TableRow
              key={video.id}
              className={cn(
                "video-card h-16",
                canSeeVideoDetails(video) && "cursor-pointer hover:bg-muted/50",
                selectedVideos.includes(video.id) && "bg-muted"
              )}
              data-video-id={video.id}
              onClick={() => !selectMode && canSeeVideoDetails(video) && handleVideoClick(video)}
            >
              {/* Checkbox de selección */}
              {user?.role === "admin" && selectMode && (
                <TableCell className="p-2">
                  <Checkbox
                    checked={selectedVideos.includes(video.id)}
                    onCheckedChange={() => toggleSelectVideo(video.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Seleccionar video ${video.title}`}
                  />
                </TableCell>
              )}
              
              {/* Miniatura */}
              <TableCell className="p-2">
                <div className="w-20 h-12 overflow-hidden rounded">
                  <ThumbnailPreview
                    src={video.thumbnailUrl}
                    alt={video.title}
                    aspectRatio="video"
                    enableZoom={false}
                    showPlaceholder={true}
                    className="w-full h-full object-cover"
                  />
                </div>
              </TableCell>
              
              {/* Título */}
              <TableCell className="font-medium">
                <div className="line-clamp-2 max-w-xs">
                  {video.optimizedTitle || video.title}
                </div>
              </TableCell>
              
              {/* Estado */}
              <TableCell>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs capitalize whitespace-nowrap",
                    getStatusBadgeColor(video.status)
                  )}
                >
                  {getStatusLabel(user!.role, video)}
                </Badge>
              </TableCell>
              
              {/* Proyecto */}
              <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                {video.projectName || "-"}
              </TableCell>
              
              {/* Asignado a */}
              <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                {video.assignedToName || "No asignado"}
              </TableCell>
              
              {/* Última actualización */}
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(video.updatedAt)}
              </TableCell>
              
              {/* Acciones */}
              {user?.role === "admin" && !selectMode && (
                <TableCell className="p-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteVideo({ videoId: video.id, projectId: video.projectId });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}