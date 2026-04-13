import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Req,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { PushService } from './push.service';
import { RolesGuard } from '../auth/roles.guard';

interface RequestWithUser extends Request {
    user: { userId: number };
}

@ApiTags('Push Notifications')
@Controller('push')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class PushController {
    constructor(private readonly pushService: PushService) {}

    @Get('vapid-public-key')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get VAPID public key for push subscription' })
    @ApiResponse({ status: 200, description: 'Returns VAPID public key or null if not configured' })
    getVapidPublicKey() {
        return {
            publicKey: this.pushService.getVapidPublicKey(),
            enabled: this.pushService.isEnabled(),
        };
    }

    @Post('subscribe')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Subscribe to push notifications' })
    @ApiResponse({ status: 201, description: 'Subscription saved' })
    @ApiResponse({ status: 400, description: 'Invalid subscription data' })
    async subscribe(
        @Req() req: RequestWithUser,
        @Body()
        body: {
            subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
        },
    ) {
        if (!body.subscription?.endpoint || !body.subscription?.keys) {
            return { error: 'Invalid subscription data' };
        }

        await this.pushService.saveSubscription(req.user.userId, body.subscription);
        return { success: true };
    }

    @Delete('unsubscribe')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Unsubscribe from push notifications' })
    @ApiResponse({ status: 200, description: 'Subscription removed' })
    async unsubscribe(
        @Req() req: RequestWithUser,
        @Body() body: { endpoint: string },
    ) {
        if (!body.endpoint) {
            return { error: 'Endpoint required' };
        }

        await this.pushService.removeSubscription(body.endpoint);
        return { success: true };
    }
}
