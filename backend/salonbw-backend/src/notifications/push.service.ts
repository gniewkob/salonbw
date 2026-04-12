import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PushSubscription } from './push-subscription.entity';
import * as webpush from 'web-push';
import { User } from '../users/user.entity';

@Injectable()
export class PushService {
    private readonly logger = new Logger(PushService.name);
    private configured = false;

    constructor(
        @InjectRepository(PushSubscription)
        private readonly subscriptionRepo: Repository<PushSubscription>,
        private readonly configService: ConfigService,
    ) {
        const publicKey = this.configService.get('VAPID_PUBLIC_KEY');
        const privateKey = this.configService.get('VAPID_PRIVATE_KEY');
        const subject = this.configService.get('VAPID_SUBJECT', 'mailto:admin@salonbw.pl');

        if (publicKey && privateKey) {
            webpush.setVapidDetails(subject, publicKey, privateKey);
            this.configured = true;
            this.logger.log('Web Push VAPID keys configured successfully.');
        } else {
            this.logger.warn('VAPID keys not provided. Web Push will be disabled.');
        }
    }

    async getVapidPublicKey(): Promise<{ publicKey: string }> {
        return {
            publicKey: this.configService.get('VAPID_PUBLIC_KEY') ?? '',
        };
    }

    async saveSubscription(userId: number, subscription: any): Promise<void> {
        const existing = await this.subscriptionRepo.findOne({
            where: { endpoint: subscription.endpoint, userId },
        });

        if (!existing) {
            const newSub = this.subscriptionRepo.create({
                userId,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys?.p256dh,
                auth: subscription.keys?.auth,
            });
            await this.subscriptionRepo.save(newSub);
        }
    }

    async removeSubscription(endpoint: string): Promise<void> {
        await this.subscriptionRepo.delete({ endpoint });
    }

    async notifyUsers(userIds: number[], payload: any): Promise<void> {
        if (!this.configured || userIds.length === 0) return;

        const subscriptions = await this.subscriptionRepo.find({
            where: { userId: In(userIds) },
        });

        if (subscriptions.length === 0) return;

        const notifications = subscriptions.map(async (sub) => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh || '',
                    auth: sub.auth || '',
                },
            };

            try {
                await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
            } catch (error: any) {
                if (error.statusCode === 410 || error.statusCode === 404) {
                    this.logger.warn(`Subscription expired or not found. Removing endpoint: ${sub.endpoint}`);
                    await this.removeSubscription(sub.endpoint);
                } else {
                    this.logger.error('Error sending push notification', error);
                }
            }
        });

        await Promise.all(notifications);
    }
}
