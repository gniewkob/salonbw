import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { LoyaltyService } from './loyalty.service';
import {
    UpdateLoyaltyProgramDto,
    CreateRewardDto,
    UpdateRewardDto,
    AwardPointsDto,
    AdjustPointsDto,
    RedeemRewardDto,
    UseRedemptionDto,
    LoyaltyTransactionQueryDto,
    RewardQueryDto,
} from './dto/loyalty.dto';

@Controller('loyalty')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class LoyaltyController {
    constructor(private readonly loyaltyService: LoyaltyService) {}

    // Program Configuration
    @Get('program')
    @Roles(Role.Admin)
    async getProgram() {
        return this.loyaltyService.getProgram();
    }

    @Put('program')
    @Roles(Role.Admin)
    async updateProgram(
        @Body() dto: UpdateLoyaltyProgramDto,
        @Request() req: { user: { id: number } },
    ) {
        return this.loyaltyService.updateProgram(dto, req.user.id);
    }

    // Statistics
    @Get('stats')
    @Roles(Role.Admin)
    async getStats() {
        return this.loyaltyService.getStats();
    }

    // Balance - Current user
    @Get('balance/me')
    @Roles(Role.Client, Role.Employee, Role.Receptionist, Role.Admin)
    async getMyBalance(@Request() req: { user: { id: number } }) {
        return this.loyaltyService.getBalanceResponse(req.user.id);
    }

    // Balance - Specific user
    @Get('balance/:userId')
    @Roles(Role.Admin, Role.Receptionist)
    async getUserBalance(@Param('userId', ParseIntPipe) userId: number) {
        return this.loyaltyService.getBalanceResponse(userId);
    }

    // Transactions - Current user
    @Get('transactions/me')
    @Roles(Role.Client, Role.Employee, Role.Receptionist, Role.Admin)
    async getMyTransactions(@Request() req: { user: { id: number } }) {
        return this.loyaltyService.getUserTransactions(req.user.id);
    }

    // Transactions - Query
    @Get('transactions')
    @Roles(Role.Admin, Role.Receptionist)
    async getTransactions(@Query() query: LoyaltyTransactionQueryDto) {
        return this.loyaltyService.getTransactions(query);
    }

    // Award points (manual or from appointment)
    @Post('points/award')
    @Roles(Role.Admin, Role.Receptionist, Role.Employee)
    async awardPoints(
        @Body() dto: AwardPointsDto,
        @Request() req: { user: { id: number } },
    ) {
        return this.loyaltyService.awardPoints(dto, req.user.id);
    }

    // Adjust points
    @Post('points/:userId/adjust')
    @Roles(Role.Admin)
    async adjustPoints(
        @Param('userId', ParseIntPipe) userId: number,
        @Body() dto: AdjustPointsDto,
        @Request() req: { user: { id: number } },
    ) {
        return this.loyaltyService.adjustPoints(userId, dto, req.user.id);
    }

    // Rewards - List
    @Get('rewards')
    @Roles(Role.Admin, Role.Receptionist)
    async getRewards(@Query() query: RewardQueryDto) {
        return this.loyaltyService.getRewards(query);
    }

    // Rewards - Available for current user
    @Get('rewards/available')
    @Roles(Role.Client, Role.Employee, Role.Receptionist, Role.Admin)
    async getAvailableRewards(@Request() req: { user: { id: number } }) {
        return this.loyaltyService.getAvailableRewards(req.user.id);
    }

    // Rewards - Get by ID
    @Get('rewards/:id')
    @Roles(Role.Admin, Role.Receptionist)
    async getReward(@Param('id', ParseIntPipe) id: number) {
        return this.loyaltyService.getReward(id);
    }

    // Rewards - Create
    @Post('rewards')
    @Roles(Role.Admin)
    async createReward(
        @Body() dto: CreateRewardDto,
        @Request() req: { user: { id: number } },
    ) {
        return this.loyaltyService.createReward(dto, req.user.id);
    }

    // Rewards - Update
    @Put('rewards/:id')
    @Roles(Role.Admin)
    async updateReward(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateRewardDto,
        @Request() req: { user: { id: number } },
    ) {
        return this.loyaltyService.updateReward(id, dto, req.user.id);
    }

    // Rewards - Delete (soft)
    @Delete('rewards/:id')
    @Roles(Role.Admin)
    async deleteReward(
        @Param('id', ParseIntPipe) id: number,
        @Request() req: { user: { id: number } },
    ) {
        return this.loyaltyService.deleteReward(id, req.user.id);
    }

    // Redeem reward
    @Post('redeem')
    @Roles(Role.Client, Role.Employee, Role.Receptionist, Role.Admin)
    async redeemReward(
        @Body() dto: RedeemRewardDto,
        @Request() req: { user: { id: number } },
    ) {
        return this.loyaltyService.redeemReward(req.user.id, dto, req.user.id);
    }

    // Redeem reward for another user
    @Post('redeem/:userId')
    @Roles(Role.Admin, Role.Receptionist)
    async redeemRewardForUser(
        @Param('userId', ParseIntPipe) userId: number,
        @Body() dto: RedeemRewardDto,
        @Request() req: { user: { id: number } },
    ) {
        return this.loyaltyService.redeemReward(userId, dto, req.user.id);
    }

    // Use redemption code
    @Post('use-coupon')
    @Roles(Role.Admin, Role.Receptionist, Role.Employee)
    async useCoupon(
        @Body() dto: UseRedemptionDto,
        @Request() req: { user: { id: number } },
    ) {
        return this.loyaltyService.useRedemption(dto, req.user.id);
    }

    // Get user redemptions - Current user
    @Get('redemptions/me')
    @Roles(Role.Client, Role.Employee, Role.Receptionist, Role.Admin)
    async getMyRedemptions(@Request() req: { user: { id: number } }) {
        return this.loyaltyService.getUserRedemptions(req.user.id);
    }

    // Get user redemptions - Specific user
    @Get('redemptions/:userId')
    @Roles(Role.Admin, Role.Receptionist)
    async getUserRedemptions(@Param('userId', ParseIntPipe) userId: number) {
        return this.loyaltyService.getUserRedemptions(userId);
    }
}
