import { google } from 'googleapis';
import { youtube_videos, YoutubeVideo, InsertYoutubeVideo } from '@db/schema';
import { eq, inArray } from 'drizzle-orm';
import { db } from "@db";

const youtube = google.youtube('v3');

export interface ChannelResult {
  channelId?: string | null
  name?: string | null
  description?: string | null
  thumbnailUrl?: string | null
  subscriberCount?: number | null
  videoCount?: number | null
  uploadsPlaylistId?: string
}

export class YouTubeService {
  private apiKey: string;
  private readonly BATCH_SIZE = 50;

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('YouTube API key is required');
    }
  }

  private extractChannelIdentifier(url: string): { type: 'id' | 'username', value: string } {
    url = url.replace(/\/$/, '');

    if (url.startsWith('UC')) {
      return { type: 'id', value: url };
    }

    if (url.includes('@')) {
      const username = url.split('@').pop()!;
      return { type: 'username', value: username };
    }

    if (url.includes('/channel/')) {
      const id = url.split('/channel/').pop()!;
      return { type: 'id', value: id };
    }

    if (url.includes('/c/')) {
      const customUrl = url.split('/c/').pop()!;
      return { type: 'username', value: customUrl };
    }

    const parts = url.split('/');
    return { type: 'username', value: parts[parts.length - 1] };
  }

  async getChannelInfo(channelUrl: string): Promise<ChannelResult> {
    try {
      const { type, value } = this.extractChannelIdentifier(channelUrl);
      console.log('Processing channel identifier:', { type, value });

      let channelId: string;

      if (type === 'username') {
        console.log('Searching for channel by username:', value);
        const searchResponse = await youtube.search.list({
          key: this.apiKey,
          part: ['snippet'],
          q: value,
          type: ['channel'],
          maxResults: 1
        });

        if (!searchResponse.data.items?.length) {
          throw new Error('Canal no encontrado');
        }

        channelId = searchResponse.data.items[0].snippet!.channelId!;
        console.log('Found channel ID:', channelId);
      } else {
        channelId = value;
      }

      console.log('Fetching channel details for ID:', channelId);
      const response = await youtube.channels.list({
        key: this.apiKey,
        part: ['snippet', 'statistics', 'contentDetails'],
        id: [channelId],
      });

      if (!response.data.items?.length) {
        throw new Error('Canal no encontrado');
      }

      const channel = response.data.items[0];
      return {
        channelId: channel.id,
        name: channel.snippet?.title,
        description: channel.snippet?.description,
        thumbnailUrl: channel.snippet?.thumbnails?.default?.url,
        subscriberCount: parseInt(channel.statistics?.subscriberCount || '0'),
        videoCount: parseInt(channel.statistics?.videoCount || '0'),
        uploadsPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads
      };
    } catch (error: any) {
      console.error('Error fetching channel info:', error);
      throw new Error('Error al obtener información del canal: ' + error.message);
    }
  }

  async getChannelVideos(channelId: string): Promise<InsertYoutubeVideo[]> {
    try {
      console.log(`Fetching videos for channel ${channelId}`)

      const channelResponse = await youtube.channels.list({
        key: this.apiKey,
        part: ['contentDetails', 'statistics'],
        id: [channelId]
      });

      if (!channelResponse.data.items?.length) {
        throw new Error('Canal no encontrado');
      }

      const uploadsPlaylistId = channelResponse.data.items[0].contentDetails?.relatedPlaylists?.uploads;
      const totalVideos = parseInt(channelResponse.data.items[0].statistics?.videoCount || '0');

      if (!uploadsPlaylistId) {
        throw new Error('No se encontró la lista de reproducción de videos');
      }

      console.info(`Fetching videos from uploads playlist ${uploadsPlaylistId}. Total videos: ${totalVideos}`)

      // Optimized query: Get existing video IDs from database
      const startTime = Date.now();
      const existingVideos: Pick<YoutubeVideo, 'youtubeId' | 'updatedAt'>[] = await db.select({
          youtubeId: youtube_videos.youtubeId,
        updatedAt: youtube_videos.updatedAt
      })
      .from(youtube_videos)
      .where(eq(youtube_videos.channelId, channelId))

      const queryTime = Date.now() - startTime;
      if (queryTime > 100) {
        console.debug(`Slow query detected fetching existing videos: ${queryTime}ms`)
      }

      // Create efficient lookup maps for video IDs
      const recentlyUpdatedIds = new Set(
        existingVideos
          .filter(v => v.updatedAt && (Date.now() - v.updatedAt.getTime() < 24 * 60 * 60 * 1000))
          .map(v => v.youtubeId)
      );

      let allVideos: InsertYoutubeVideo[] = [];
      
      let nextPageToken: string | undefined = undefined;
      let pageCounter = 0;

      do {
        pageCounter++;
        console.debug(`Fetching playlist page ${pageCounter} ${nextPageToken ? `with token ${nextPageToken}` : ''}`);

        const playlistResponse = await youtube.playlistItems.list({
          key: this.apiKey,
          part: ['snippet', 'contentDetails'],
          playlistId: uploadsPlaylistId,
          maxResults: 50, // Maximum allowed by YouTube API
          pageToken: nextPageToken,
        }) as { 
          data: {
            items?: {
              contentDetails?: { videoId?: string } 
            }[],
            nextPageToken?: string
          }
        }

        if (!playlistResponse.data.items?.length) {
          console.debug(`No items found in playlist page ${pageCounter}`);
          break;
        }

        // Filter out videos that were recently updated
        const videoIds = playlistResponse.data.items
          .map(item => item.contentDetails?.videoId)
          .filter(id => !recentlyUpdatedIds.has(id!)) as string[];

        console.debug(`Filtered ${videoIds.length} video IDs from playlist page ${pageCounter}`);

        if (videoIds.length > 0) {
          // Process videos in smaller batches to avoid API limits
          const batchSize = 25; // YouTube API recommends smaller batch sizes for details request
          for (let i = 0; i < videoIds.length; i += batchSize) {
            const batchIds = videoIds.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;

            console.debug(`Processing video batch ${batchNumber} with ${batchIds.length} videos`);

            const videosResponse = await youtube.videos.list({
              key: this.apiKey,
              part: ['snippet', 'statistics', 'contentDetails'],
              id: batchIds,
            });

            const batchVideos = videosResponse.data.items?.map(video => ({
              youtubeId: video.id!,
              channelId,
              title: video.snippet?.title || '',
              description: video.snippet?.description || null,
              publishedAt: video.snippet?.publishedAt ? new Date(video.snippet.publishedAt) : new Date(),
              thumbnailUrl: video.snippet?.thumbnails?.default?.url || null,
              viewCount: parseInt(video.statistics?.viewCount || '0'),
              likeCount: parseInt(video.statistics?.likeCount || '0'),
              commentCount: parseInt(video.statistics?.commentCount || '0'),
              duration: video.contentDetails?.duration || null,
              tags: video.snippet?.tags || [],
            })) || [];

            allVideos = [...allVideos, ...batchVideos.map<InsertYoutubeVideo>(bv => {
              return {
                youtubeId: bv.youtubeId,
                channelId: bv.channelId,
                title: bv.title,
                description: bv.description,
                publishedAt: bv.publishedAt,
                thumbnailUrl: bv.thumbnailUrl,
                viewCount: bv.viewCount,
                likeCount: bv.likeCount,
                commentCount: bv.commentCount,
                duration: bv.duration,
                tags: bv.tags,
                updatedAt: new Date(),
                analyzed: false,
                createdAt: new Date(),
                sentToOptimize: false,
                sentToOptimizeAt: null,
                sentToOptimizeReason: null,
                sentToOptimizeProjectId: null,
              }
            })]
          }
        }

        nextPageToken = playlistResponse.data.nextPageToken;

      } while (nextPageToken);

      console.info(`Completed fetching ${allVideos.length} videos from channel ${channelId}`);

      return allVideos;
    } catch (error: any) {
      console.error(`Error fetching channel videos for ${channelId}: ${error.message}`);
      throw new Error('Error al obtener videos del canal: ' + error.message);
    }
  }

  async upsertYoutubeVideos(videos: InsertYoutubeVideo[]) {

    if (!videos.length) return 0;

    try {
      const startTime = performance.now();
      let totalInserted = 0;

      // Get all existing video IDs to determine insert vs update
      // Using a Set for O(1) lookups
      const existingVideoIds = new Set<string>();
      const existingVideos = await db
        .select({ videoId: youtube_videos.youtubeId })
        .from(youtube_videos)
        .where(inArray(
          youtube_videos.youtubeId, 
          videos.map(v => v.youtubeId)
        ));

      existingVideos.forEach(v => existingVideoIds.add(v.videoId));

      // Separate videos into ones to insert and ones to update
      const videosToInsert = videos.filter(v => !existingVideoIds.has(v.youtubeId));
      const videosToUpdate = videos.filter(v => existingVideoIds.has(v.youtubeId));

      console.debug(`Processing ${videosToInsert.length} new videos and ${videosToUpdate.length} updates`);

      // Batch insert new videos
      if (videosToInsert.length > 0) {
        for (let i = 0; i < videosToInsert.length; i += this.BATCH_SIZE) {
          const batch = videosToInsert.slice(i, i + this.BATCH_SIZE);

          await db.transaction(async (tx) => {
            await tx.insert(youtube_videos)
              .values(batch.map(video => ({
                ...video,
                createdAt: new Date(),
                updatedAt: new Date(),
              })));
          });

          totalInserted += batch.length;
        }
      }

      // Batch update existing videos with fresh data
      if (videosToUpdate.length > 0) {
        for (let i = 0; i < videosToUpdate.length; i += this.BATCH_SIZE) {
          const batch = videosToUpdate.slice(i, i + this.BATCH_SIZE);

          for (const video of batch) {
            await db
              .update(youtube_videos)
              .set({
                ...video,
                updatedAt: new Date(),
              })
              .where(eq(youtube_videos.youtubeId, video.youtubeId));
          }
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.debug(`Completed batch upsert of ${videos.length} YouTube videos in ${totalTime.toFixed(2)}ms`);

      return totalInserted;
    } catch (error) {
      console.error('Error in upsertYouTubeVideos', error);
      throw error;
    }
  }

}

export const youtubeService = new YouTubeService();