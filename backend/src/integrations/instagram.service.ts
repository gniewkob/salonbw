import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface InstagramApiItem {
    id: string;
    caption?: string;
    media_url: string;
    thumbnail_url?: string;
    permalink: string;
    media_type: string;
}

export interface InstagramPost {
    imageUrl: string;
    caption?: string;
    link: string;
    thumbnailUrl: string;
}

@Injectable()
export class InstagramService {
    private readonly token = process.env.INSTAGRAM_ACCESS_TOKEN;
    private cache: { timestamp: number; posts: InstagramPost[] } | null = null;
    private readonly baseUrl = 'https://graph.instagram.com';
    private readonly cacheMs = 10 * 60 * 1000; // 10 minutes

    async fetchLatestPosts(count: number): Promise<InstagramPost[]> {
        if (this.cache && Date.now() - this.cache.timestamp < this.cacheMs) {
            return this.cache.posts.slice(0, count);
        }
        if (!this.token) {
            Logger.error('INSTAGRAM_ACCESS_TOKEN not set');
            return [];
        }
        try {
            const res = await axios.get<{ data: InstagramApiItem[] }>(
                `${this.baseUrl}/me/media`,
                {
                    params: {
                        fields: 'id,caption,media_url,thumbnail_url,permalink,media_type',
                        access_token: this.token,
                    },
                },
            );
            const posts = res.data.data
                .filter((p) => p.media_type === 'IMAGE')
                .map((p) => ({
                    imageUrl: p.media_url,
                    caption: p.caption,
                    link: p.permalink,
                    thumbnailUrl: p.thumbnail_url || p.media_url,
                }));
            this.cache = { timestamp: Date.now(), posts };
            return posts.slice(0, count);
        } catch (err) {
            Logger.error('Instagram API error', err as any);
            return [];
        }
    }
}
