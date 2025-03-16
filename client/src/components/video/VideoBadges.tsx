import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UserRole } from '@/types/user';
import { useUser } from '@/hooks/use-user';
import { cn } from '@/lib/utils';
import { AffiliateStatusIndicator } from './AffiliateBadge';
import { useVideoAffiliates } from '@/hooks/useVideoAffiliates';

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'border-purple-200 bg-purple-50 text-purple-900 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-200',
  manager: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200',
  youtuber: 'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-200',
  editor: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200',
  reviewer: 'border-cyan-200 bg-cyan-50 text-cyan-900 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-200',
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  youtuber: 'Youtuber',
  editor: 'Editor',
  reviewer: 'Revisor',
};

// Interfaces
interface VideoBadgesProps {
  video: any;
  compact?: boolean;
  className?: string;
}

/**
 * Componente para mostrar información de usuarios y afiliados en un video
 */
export function VideoBadges({ video, compact = false, className = '' }: VideoBadgesProps) {
  const { user } = useUser();
  
  // Obtener la información de afiliados para este video
  const { affiliates, isLoading } = useVideoAffiliates(video.id);
  
  // Calcular el número de afiliados pendientes
  const pendingAffiliates = !isLoading ? 
    affiliates.filter(a => !a.isIncluded).length : 0;
  
  // Si no hay usuario asignado y no hay afiliados, no mostrar nada
  if (!video.assignedToUser && pendingAffiliates === 0) {
    return null;
  }
  
  return (
    <div className={cn("flex items-center gap-2 mt-2", className)}>
      {/* Usuario asignado */}
      {video.assignedToUser && (
        <div className={cn(
          "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs border",
          ROLE_COLORS[video.assignedToUser.role as UserRole],
          compact ? "leading-3" : ""
        )}>
          <Avatar className={compact ? "h-4 w-4" : "h-5 w-5"}>
            <AvatarImage
              src={video.assignedToUser.avatarUrl || "/default-avatar.svg"}
              alt={video.assignedToUser.name || "Usuario"}
            />
            <AvatarFallback className="text-[10px]">
              {(video.assignedToUser.name || "U").charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]">
            {video.assignedToUser.name || "Usuario"}
          </span>
          {!compact && (
            <span className="text-[10px] opacity-80">
              {ROLE_LABELS[video.assignedToUser.role as UserRole]}
            </span>
          )}
        </div>
      )}
      
      {/* Indicador de afiliados pendientes */}
      {pendingAffiliates > 0 && (
        <AffiliateStatusIndicator
          pendingCount={pendingAffiliates}
          isCompact={compact}
        />
      )}
    </div>
  );
}