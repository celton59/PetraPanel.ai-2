import { useState, useEffect } from 'react';
import { UserBadges } from './UserBadges';
import { AffiliateBadge, AffiliatesBadgeContainer } from './AffiliateBadge';
import { ApiVideo } from '@/hooks/useVideos';
import axios from 'axios';

interface VideoBadgesProps {
  video: ApiVideo;
  compact?: boolean;
}

export function VideoBadges({ video, compact = false }: VideoBadgesProps) {
  const [affiliates, setAffiliates] = useState<Array<{
    id: number;
    companyName: string;
    isIncluded: boolean;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Solo cargar afiliados si tenemos un videoId
    if (video?.id) {
      fetchAffiliates();
    }
  }, [video?.id]);

  const fetchAffiliates = async () => {
    if (!video?.id) return;
    
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/affiliates/videos/${video.id}/matches`);
      const affiliateData = response.data.data || [];
      
      // Transformar los datos al formato que esperan nuestros componentes
      const formattedAffiliates = affiliateData.map((affiliate: any) => ({
        id: affiliate.id,
        companyName: affiliate.company?.name || 'Desconocido',
        isIncluded: affiliate.included_by_youtuber || false
      }));
      
      setAffiliates(formattedAffiliates);
    } catch (error) {
      console.error('Error al cargar afiliados:', error);
      setAffiliates([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Badges de usuarios */}
      <UserBadges video={video} compact={compact} />
      
      {/* Badges de afiliados */}
      {!isLoading && affiliates.length > 0 && (
        <AffiliatesBadgeContainer 
          affiliates={affiliates}
          className={compact ? "ml-1" : ""}
        />
      )}
    </div>
  );
}