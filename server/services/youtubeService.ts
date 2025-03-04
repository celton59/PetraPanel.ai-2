import { google } from 'googleapis';
import { youtube_channels, youtube_videos, YoutubeVideo } from '@db/schema';
import { eq, desc, sql, inArray } from 'drizzle-orm';
import { db } from "@db";

const youtube = google.youtube('v3');

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

  async getChannelInfo(channelUrl: string) {
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

  async getChannelVideos(channelId: string) {
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
      const existingVideos: Pick<YoutubeVideo, 'videoId' | 'updatedAt'>[] = await db.select({
        videoId: youtube_videos.videoId,
        updatedAt: youtube_videos.updatedAt
      })
      .from(youtube_videos)
      .where(eq(youtube_videos.channelId, channelId))

      const queryTime = Date.now() - startTime;
      if (queryTime > 100) {
        console.debug(`Slow query detected fetching existing videos: ${queryTime}ms`)
      }

      // Create efficient lookup maps for video IDs
      const existingVideoIds = new Set(existingVideos.map(v => v.videoId));
      const recentlyUpdatedIds = new Set(
        existingVideos
          .filter(v => v.updatedAt && (Date.now() - v.updatedAt.getTime() < 24 * 60 * 60 * 1000))
          .map(v => v.videoId)
      );

      const allVideos: YoutubeVideo[] = [];
      
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
        });

        if (!playlistResponse.data.items?.length) {
          console.debug(`No items found in playlist page ${pageCounter}`);
          break;
        }

        // Filter out videos that were recently updated
        const videoIds = playlistResponse.data.items
          .map(item => item.contentDetails?.videoId)
          .filter(Boolean)
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
              videoId: video.id!,
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

            allVideos = [...allVideos, ...batchVideos.map<YoutubeVideo>(bv => {
              return {
                videoId: bv.videoId,
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
                id: 
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

  async updateChannelVideos(channelId: string) {
    try {
      const videos = await this.getChannelVideos(channelId);
      this.logger.info(`Fetched ${videos.length} videos for batch update for channel ${channelId}`);

      // No videos to process
      if (videos.length === 0) {
        this.logger.info(`No videos to update for channel ${channelId}`);

        // Still update the channel's last fetch time
        const now = new Date();
        await db
          .update(youtube_channels)
          .set({
            lastVideoFetch: now,
            updatedAt: now
          })
          .where(eq(youtube_channels.channelId, channelId));

        return { total: 0, success: 0, errors: 0 };
      }

      // Use the optimized DbUtils function for batch upsert
      const startTime = Date.now();
      try {
        const successCount = await DbUtils.upsertYouTubeVideos(videos);

        const queryTime = Date.now() - startTime;
        if (queryTime > 500) {
          this.logger.debug(`Slow batch operation detected: ${queryTime}ms for ${videos.length} videos`);
        }

        this.logger.info(`Successfully processed ${successCount} videos for channel ${channelId}`);

        // Update channel's last fetch time
        const now = new Date();
        await db
          .update(youtube_channels)
          .set({
            lastVideoFetch: now,
            updatedAt: now
          })
          .where(eq(youtube_channels.channelId, channelId));

        return { total: videos.length, success: successCount, errors: 0 };
      } catch (error) {
        const queryTime = Date.now() - startTime;
        this.logger.error(`Failed to process videos for channel ${channelId} after ${queryTime}ms: ${error}`);
        return { total: videos.length, success: 0, errors: videos.length };
      }
    } catch (error) {
      this.logger.error(`Error updating channel videos for ${channelId}: ${error}`);
      throw new Error('Error al actualizar videos del canal');
    }
  }
}

export const youtubeService = new YouTubeService();