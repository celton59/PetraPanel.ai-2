import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Channel } from "../types";

interface TableActionsProps {
  channelFilter: string;
  setChannelFilter: (value: string) => void;
  setCurrentPage: (page: number) => void;
  channels: Channel[] | undefined;
  handleDownloadCSV: () => void;
  isDownloading: boolean;
}

export function TableActions({
  channelFilter,
  setChannelFilter,
  setCurrentPage,
  channels,
  handleDownloadCSV,
  isDownloading
}: TableActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={channelFilter}
        onValueChange={(value) => {
          setChannelFilter(value);
          setCurrentPage(1);
        }}
      >
        <SelectTrigger className="h-10 min-w-[220px]">
          <SelectValue placeholder="Filtrar por canal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los canales</SelectItem>
          {channels?.map((channel) => (
            <SelectItem key={channel.channelId} value={channel.channelId}>
              {channel.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        onClick={handleDownloadCSV}
        disabled={isDownloading}
        className="h-10"
        aria-label="Descargar CSV"
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline ml-2">Exportar</span>
      </Button>
    </div>
  );
}