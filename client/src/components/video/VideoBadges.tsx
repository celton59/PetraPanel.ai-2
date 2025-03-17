import React from 'react';
import { UserBadges } from './UserBadges';
import { ApiVideo } from '@/hooks/useVideos';
  
// Interfaces
interface VideoBadgesProps {
  video: ApiVideo;
  compact?: boolean;
}

/**
 * Componente que muestra badges de usuarios asignados al video
 * Este componente ya NO incluye los badges de afiliados, que ahora 
 * se muestran de forma independiente para mayor claridad
 */
export function VideoBadges({ video, compact = false }: VideoBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {/* Badges de usuarios asignados */}
      <UserBadges video={video} compact={compact} />
    </div>
  );
}