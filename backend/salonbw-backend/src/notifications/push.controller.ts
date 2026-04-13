import {
    Controller,
    Get,
    Post,
    Body,
    UseGuards,
    Req,
    Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PushService } from './push.service';
import { Role } from '../users/role.enum';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('push-notifications')
@Controller('push')
export class PushController {
    constructor(private readonly pushService: PushService) {}

    @Get('public-key')
    @ApiOperation({ summary: 'Get VAPID public key for Web Push' })
    async getPublicKey() {
        return this.pushService.getVapidPublicKey();
    }

    @Post('subscribe')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Employee, Role.Receptionist, Role.Customer)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Save Web Push subscription' })
    async subscribe(
        @CurrentUser() user: { userId: number },
        @Body() subscription: any,
    ) {
        await this.pushService.saveSubscription(user.userId, subscription);
        return { success: true };
    }

    @Delete('unsubscribe')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Employee, Role.Receptionist, Role.Customer)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Remove Web Push subscription' })
    async unsubscribe(@Body('endpoint') endpoint: string) {
        if (!endpoint) return { success: false };
        await this.pushService.removeSubscription(endpoint);
        return { success: true };
    }
}
