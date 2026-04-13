import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PushSubscription } from './push-subscription.entity';

// web-push types
interface WebPush {
    setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
    sendNotification(subscription: unknown, payload: string): Promise<unknown>;
}

@Injectable()
export class PushService {
    private readonly logger = new Logger(PushService.name);
    private readonly webPush: WebPush | null = null;
    private readonly vapidPublicKey: string | null = null;
    private readonly vapidPrivateKey: string | null = null;

    constructor(
        @InjectRepository(PushSubscription)
        private readonly subscriptionsRepo: Repository<PushSubscription>,
        private readonly config: ConfigService,
    ) {
        this.vapidPublicKey = this.config.get<string>('VAPID_PUBLIC_KEY') || null;
        this.vapidPrivateKey = this.config.get<string>('VAPID_PRIVATE_KEY') || null;

        if (this.vapidPublicKey && this.vapidPrivateKey) {
            try {
                // Dynamic import web-push to avoid errors if not configured
                const webPush = require('web-push');
                webPush.setVapidDetails(
                    'mailto:admin@salon-bw.pl',
                    this.vapidPublicKey,
                    this.vapidPrivateKey,
                );
                this.webPush = webPush;
                this.logger.log('Push notifications configured successfully');
            } catch (error) {
                this.logger.error('Failed to configure push notifications', error);
            }
        } else {
            this.logger.warn('VAPID keys not configured - push notifications disabled');
        }
    }

    isEnabled(): boolean {
        return this.webPush !== null;
    }

    getVapidPublicKey(): string | null {
        return this.vapidPublicKey;
    }

    async saveSubscription(
        userId: number,
        subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    ): Promise<void> {
        // Deactivate existing subscriptions for this endpoint
        await this.subscriptionsRepo.update(
            { endpoint: subscription.endpoint },
            { isActive: false },
        );

        // Create new subscription
        const pushSub = this.subscriptionsRepo.create({
            userId,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            isActive: true,
        });

        await this.subscriptionsRepo.save(pushSub);
        this.logger.debug({ userId }, 'Push subscription saved');
    }

    async removeSubscription(endpoint: string): Promise<void> {
        await this.subscriptionsRepo.update({ endpoint }, { isActive: false });
        this.logger.debug({ endpoint }, 'Push subscription removed');
    }

    async sendNotification(
        userId: number,
        payload: { title: string; body: string; icon?: string; url?: string },
    ): Promise<void> {
        if (!this.webPush) {
            this.logger.debug('Push notifications not configured');
            return;
        }

        const subscriptions = await this.subscriptionsRepo.find({
            where: { userId, isActive: true },
        });

        if (subscriptions.length === 0) {
            return;
        }

        const payloadString = JSON.stringify(payload);

        for (const sub of subscriptions) {
            try {
                await this.webPush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth,
                        },
                    },
                    payloadString,
                );
                this.logger.debug({ userId }, 'Push notification sent');
            } catch (error: any) {
                // If subscription is expired/invalid, deactivate it
                if (error?.statusCode === 410 || error?.statusCode === 404) {
                    await this.subscriptionsRepo.update(sub.id, { isActive: false });
                    this.logger.debug({ userId, endpoint: sub.endpoint }, 'Push subscription expired, deactivated');
                } else {
                    this.logger.error({ userId, error }, 'Failed to send push notification');
                }
            }
        }
    }

    async broadcastNotification(
        userIds: number[],
        payload: { title: string; body: string; icon?: string; url?: string },
    ): Promise<void> {
        for (const userId of userIds) {
            await this.sendNotification(userId, payload);
        }
    }
}
