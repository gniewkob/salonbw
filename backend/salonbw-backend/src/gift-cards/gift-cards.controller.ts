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
import { GiftCardsService } from './gift-cards.service';
import {
    CreateGiftCardDto,
    UpdateGiftCardDto,
    RedeemGiftCardDto,
    AdjustBalanceDto,
    GiftCardQueryDto,
} from './dto/gift-card.dto';

@Controller('gift-cards')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class GiftCardsController {
    constructor(private readonly giftCardsService: GiftCardsService) {}

    // List gift cards
    @Get()
    @Roles(Role.Admin, Role.Receptionist)
    async findAll(@Query() query: GiftCardQueryDto) {
        return this.giftCardsService.findAll(query);
    }

    // Get statistics
    @Get('stats')
    @Roles(Role.Admin)
    async getStats() {
        return this.giftCardsService.getStats();
    }

    // Validate a gift card (for checkout)
    @Get('validate/:code')
    @Roles(Role.Admin, Role.Receptionist, Role.Employee)
    async validate(
        @Param('code') code: string,
        @Query('amount') amount?: number,
        @Query('serviceId') serviceId?: number,
    ) {
        return this.giftCardsService.validate(code, amount, serviceId);
    }

    // Get gift card by ID
    @Get(':id')
    @Roles(Role.Admin, Role.Receptionist)
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.giftCardsService.findOne(id);
    }

    // Get gift card by code
    @Get('code/:code')
    @Roles(Role.Admin, Role.Receptionist)
    async findByCode(@Param('code') code: string) {
        return this.giftCardsService.findByCode(code);
    }

    // Get transactions for a gift card
    @Get(':id/transactions')
    @Roles(Role.Admin, Role.Receptionist)
    async getTransactions(@Param('id', ParseIntPipe) id: number) {
        return this.giftCardsService.getTransactions(id);
    }

    // Create (sell) a new gift card
    @Post()
    @Roles(Role.Admin, Role.Receptionist)
    async create(
        @Body() dto: CreateGiftCardDto,
        @Request() req: { user: { id: number } },
    ) {
        return this.giftCardsService.create(dto, req.user.id);
    }

    // Update gift card
    @Put(':id')
    @Roles(Role.Admin)
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateGiftCardDto,
        @Request() req: { user: { id: number } },
    ) {
        return this.giftCardsService.update(id, dto, req.user.id);
    }

    // Redeem gift card (use during payment)
    @Post('redeem')
    @Roles(Role.Admin, Role.Receptionist, Role.Employee)
    async redeem(
        @Body() dto: RedeemGiftCardDto,
        @Request() req: { user: { id: number } },
    ) {
        return this.giftCardsService.redeem(dto, req.user.id);
    }

    // Adjust balance (refund, correction)
    @Post(':id/adjust')
    @Roles(Role.Admin)
    async adjustBalance(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: AdjustBalanceDto,
        @Request() req: { user: { id: number } },
    ) {
        return this.giftCardsService.adjustBalance(id, dto, req.user.id);
    }

    // Cancel gift card
    @Delete(':id')
    @Roles(Role.Admin)
    async cancel(
        @Param('id', ParseIntPipe) id: number,
        @Body('reason') reason: string,
        @Request() req: { user: { id: number } },
    ) {
        return this.giftCardsService.cancel(id, req.user.id, reason);
    }
}
