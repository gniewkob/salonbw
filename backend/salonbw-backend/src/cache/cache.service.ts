import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

type MemoryEntry = {
    value: unknown;
    expiresAt: number;
};

@Injectable()
export class AppCacheService implements OnModuleDestroy {
    private readonly logger = new Logger(AppCacheService.name);
    private readonly ttlSeconds: number;
    private readonly redis: Redis | null;
    private readonly memoryStore = new Map<string, MemoryEntry>();

    constructor(private readonly config: ConfigService) {
        const ttlRaw = this.config.get<string>('CACHE_TTL_SECONDS', '60');
        const parsedTtl = Number(ttlRaw);
        this.ttlSeconds = Number.isFinite(parsedTtl) && parsedTtl > 0 ? parsedTtl : 60;

        const redisUrl = this.config.get<string>('REDIS_URL');
        if (redisUrl) {
            this.redis = new Redis(redisUrl, {
                lazyConnect: true,
            });
            this.redis
                .connect()
                .then(() => this.logger.log('Connected to Redis cache'))
                .catch((error) => {
                    this.logger.warn(
                        `Failed to connect to Redis at startup: ${error instanceof Error ? error.message : error}`,
                    );
                });
            this.redis.on('error', (error) => {
                this.logger.warn(
                    `Redis cache error: ${error instanceof Error ? error.message : error}`,
                );
            });
        } else {
            this.redis = null;
            this.logger.log('Using in-memory cache store');
        }
    }

    async onModuleDestroy(): Promise<void> {
        if (this.redis) {
            await this.redis.quit();
        }
        this.memoryStore.clear();
    }

    async get<T>(key: string): Promise<T | null> {
        if (this.redis) {
            const raw = await this.redis.get(key);
            if (!raw) return null;
            try {
                return JSON.parse(raw) as T;
            } catch (error) {
                this.logger.warn(
                    `Failed to parse cached value for key ${key}: ${error instanceof Error ? error.message : error}`,
                );
                return null;
            }
        }

        const entry = this.memoryStore.get(key);
        if (!entry) return null;
        if (entry.expiresAt < Date.now()) {
            this.memoryStore.delete(key);
            return null;
        }
        return entry.value as T;
    }

    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        const ttl = this.resolveTtl(ttlSeconds);
        if (this.redis) {
            await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
            return;
        }
        this.memoryStore.set(key, {
            value,
            expiresAt: Date.now() + ttl * 1000,
        });
    }

    async del(key: string): Promise<void> {
        if (this.redis) {
            await this.redis.del(key);
            return;
        }
        this.memoryStore.delete(key);
    }

    async wrap<T>(key: string, fn: () => Promise<T>, ttlSeconds?: number): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached !== null) {
            return cached;
        }
        const value = await fn();
        await this.set(key, value, ttlSeconds);
        return value;
    }

    private resolveTtl(ttlSeconds?: number): number {
        const ttl = ttlSeconds ?? this.ttlSeconds;
        if (!Number.isFinite(ttl) || ttl <= 0) {
            return this.ttlSeconds;
        }
        return Math.floor(ttl);
    }
}
