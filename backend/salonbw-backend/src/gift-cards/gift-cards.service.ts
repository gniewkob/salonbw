import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    Repository,
    FindOptionsWhere,
    LessThanOrEqual,
    MoreThanOrEqual,
} from 'typeorm';
import {
    GiftCard,
    GiftCardStatus,
    GiftCardTransaction,
    GiftCardTransactionType,
} from './entities/gift-card.entity';
import {
    CreateGiftCardDto,
    UpdateGiftCardDto,
    RedeemGiftCardDto,
    AdjustBalanceDto,
    GiftCardQueryDto,
    ValidateGiftCardResponse,
} from './dto/gift-card.dto';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';

@Injectable()
export class GiftCardsService {
    private readonly logger = new Logger(GiftCardsService.name);

    constructor(
        @InjectRepository(GiftCard)
        private readonly giftCardRepo: Repository<GiftCard>,
        @InjectRepository(GiftCardTransaction)
        private readonly transactionRepo: Repository<GiftCardTransaction>,
        private readonly logService: LogService,
    ) {}

    // Gift Card CRUD
    async findAll(
        query: GiftCardQueryDto,
    ): Promise<{ data: GiftCard[]; total: number }> {
        const where: FindOptionsWhere<GiftCard> = {};
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;

        if (query.status) {
            where.status = query.status;
        }
        if (query.recipientId) {
            where.recipientId = query.recipientId;
        }
        if (query.purchasedById) {
            where.purchasedById = query.purchasedById;
        }
        if (query.code) {
            where.code = query.code;
        }

        const [data, total] = await this.giftCardRepo.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['purchasedBy', 'recipient', 'soldBy'],
        });

        return { data, total };
    }

    async findOne(id: number): Promise<GiftCard> {
        const card = await this.giftCardRepo.findOne({
            where: { id },
            relations: ['purchasedBy', 'recipient', 'soldBy', 'transactions'],
        });

        if (!card) {
            throw new NotFoundException(`Gift card with ID ${id} not found`);
        }

        return card;
    }

    async findByCode(code: string): Promise<GiftCard> {
        const card = await this.giftCardRepo.findOne({
            where: { code: code.toUpperCase() },
            relations: ['purchasedBy', 'recipient'],
        });

        if (!card) {
            throw new NotFoundException(
                `Gift card with code "${code}" not found`,
            );
        }

        return card;
    }

    async create(dto: CreateGiftCardDto, actorId: number): Promise<GiftCard> {
        // Generate unique code
        const code = await this.generateUniqueCode();

        const card = this.giftCardRepo.create({
            ...dto,
            code,
            currentBalance: dto.initialValue,
            validFrom: new Date(dto.validFrom),
            validUntil: new Date(dto.validUntil),
            soldById: actorId,
            soldAt: new Date(),
        });

        const saved = await this.giftCardRepo.save(card);

        // Create purchase transaction
        await this.createTransaction(saved.id, {
            type: GiftCardTransactionType.Purchase,
            amount: dto.initialValue,
            balanceAfter: dto.initialValue,
            performedById: actorId,
            notes: 'Zakup karty podarunkowej',
        });

        await this.logService.logAction(
            { id: actorId } as any,
            LogAction.GIFT_CARD_CREATED,
            {
                giftCardId: saved.id,
                code: saved.code,
                value: saved.initialValue,
            },
        );

        this.logger.log(`Gift card ${code} created by user ${actorId}`);
        return saved;
    }

    async update(
        id: number,
        dto: UpdateGiftCardDto,
        actorId: number,
    ): Promise<GiftCard> {
        const card = await this.findOne(id);

        if (
            card.status === GiftCardStatus.Used ||
            card.status === GiftCardStatus.Cancelled
        ) {
            throw new BadRequestException(
                'Cannot update a used or cancelled gift card',
            );
        }

        Object.assign(card, dto);
        if (dto.validUntil) {
            card.validUntil = new Date(dto.validUntil);
        }

        const updated = await this.giftCardRepo.save(card);

        await this.logService.logAction(
            { id: actorId } as any,
            LogAction.GIFT_CARD_UPDATED,
            { giftCardId: id, changes: dto },
        );

        return updated;
    }

    async cancel(
        id: number,
        actorId: number,
        reason?: string,
    ): Promise<GiftCard> {
        const card = await this.findOne(id);

        if (card.status === GiftCardStatus.Used) {
            throw new BadRequestException(
                'Cannot cancel a fully used gift card',
            );
        }

        card.status = GiftCardStatus.Cancelled;
        const updated = await this.giftCardRepo.save(card);

        await this.logService.logAction(
            { id: actorId } as any,
            LogAction.GIFT_CARD_CANCELLED,
            { giftCardId: id, reason },
        );

        return updated;
    }

    // Validation and redemption
    async validate(
        code: string,
        amount?: number,
        serviceId?: number,
    ): Promise<ValidateGiftCardResponse> {
        const card = await this.giftCardRepo.findOne({
            where: { code: code.toUpperCase() },
        });

        if (!card) {
            return { valid: false, reason: 'Karta nie istnieje' };
        }

        const now = new Date();
        if (card.status !== GiftCardStatus.Active) {
            return {
                valid: false,
                reason: `Karta jest ${this.getStatusLabel(card.status)}`,
            };
        }

        if (card.validFrom > now) {
            return { valid: false, reason: 'Karta jeszcze nie jest aktywna' };
        }

        if (card.validUntil < now) {
            return { valid: false, reason: 'Karta wygasła' };
        }

        if (amount && card.currentBalance < amount) {
            return {
                valid: false,
                reason: `Niewystarczające środki (dostępne: ${card.currentBalance} ${card.currency})`,
            };
        }

        if (
            serviceId &&
            card.allowedServices.length > 0 &&
            !card.allowedServices.includes(serviceId)
        ) {
            return {
                valid: false,
                reason: 'Karta nie może być użyta do tej usługi',
            };
        }

        return {
            valid: true,
            giftCard: {
                code: card.code,
                currentBalance: Number(card.currentBalance),
                validUntil: card.validUntil.toISOString(),
                allowedServices: card.allowedServices,
            },
        };
    }

    async redeem(dto: RedeemGiftCardDto, actorId: number): Promise<GiftCard> {
        const card = await this.findByCode(dto.code);

        // Validate
        const validation = await this.validate(dto.code, dto.amount);
        if (!validation.valid) {
            throw new BadRequestException(validation.reason);
        }

        // Deduct balance
        const newBalance = Number(card.currentBalance) - dto.amount;
        card.currentBalance = newBalance;

        // Update status if fully used
        if (newBalance <= 0) {
            card.status = GiftCardStatus.Used;
        }

        const updated = await this.giftCardRepo.save(card);

        // Create transaction
        await this.createTransaction(card.id, {
            type: GiftCardTransactionType.Redemption,
            amount: -dto.amount,
            balanceAfter: newBalance,
            appointmentId: dto.appointmentId,
            performedById: actorId,
            notes: dto.notes,
        });

        await this.logService.logAction(
            { id: actorId } as any,
            LogAction.GIFT_CARD_REDEEMED,
            {
                giftCardId: card.id,
                code: card.code,
                amount: dto.amount,
                remainingBalance: newBalance,
            },
        );

        this.logger.log(
            `Gift card ${card.code} redeemed for ${dto.amount} by user ${actorId}`,
        );
        return updated;
    }

    async adjustBalance(
        id: number,
        dto: AdjustBalanceDto,
        actorId: number,
    ): Promise<GiftCard> {
        const card = await this.findOne(id);

        if (card.status === GiftCardStatus.Cancelled) {
            throw new BadRequestException(
                'Cannot adjust balance of a cancelled card',
            );
        }

        const newBalance = Number(card.currentBalance) + dto.amount;

        if (newBalance < 0) {
            throw new BadRequestException(
                'Resulting balance cannot be negative',
            );
        }

        card.currentBalance = newBalance;

        // Update status
        if (newBalance > 0 && card.status === GiftCardStatus.Used) {
            card.status = GiftCardStatus.Active;
        } else if (newBalance <= 0 && card.status === GiftCardStatus.Active) {
            card.status = GiftCardStatus.Used;
        }

        const updated = await this.giftCardRepo.save(card);

        await this.createTransaction(card.id, {
            type: GiftCardTransactionType.Adjustment,
            amount: dto.amount,
            balanceAfter: newBalance,
            performedById: actorId,
            notes: dto.notes,
        });

        return updated;
    }

    // Transactions
    async getTransactions(giftCardId: number): Promise<GiftCardTransaction[]> {
        return this.transactionRepo.find({
            where: { giftCardId },
            order: { createdAt: 'DESC' },
            relations: ['performedBy'],
        });
    }

    // Statistics
    async getStats() {
        const now = new Date();

        const [total, active, totalValue, usedValue] = await Promise.all([
            this.giftCardRepo.count(),
            this.giftCardRepo.count({
                where: {
                    status: GiftCardStatus.Active,
                    validUntil: MoreThanOrEqual(now),
                },
            }),
            this.giftCardRepo
                .createQueryBuilder('gc')
                .select('SUM(gc.initialValue)', 'sum')
                .getRawOne(),
            this.giftCardRepo
                .createQueryBuilder('gc')
                .select('SUM(gc.initialValue - gc.currentBalance)', 'sum')
                .where('gc.status IN (:...statuses)', {
                    statuses: [GiftCardStatus.Active, GiftCardStatus.Used],
                })
                .getRawOne(),
        ]);

        return {
            totalCards: total,
            activeCards: active,
            totalValue: Number(totalValue?.sum || 0),
            usedValue: Number(usedValue?.sum || 0),
            outstandingValue:
                Number(totalValue?.sum || 0) - Number(usedValue?.sum || 0),
        };
    }

    // Expire old cards (called by cron job)
    async expireOldCards(): Promise<number> {
        const now = new Date();

        const result = await this.giftCardRepo.update(
            {
                status: GiftCardStatus.Active,
                validUntil: LessThanOrEqual(now),
            },
            { status: GiftCardStatus.Expired },
        );

        if (result.affected && result.affected > 0) {
            this.logger.log(`Expired ${result.affected} gift cards`);
        }

        return result.affected || 0;
    }

    // Helpers
    private async generateUniqueCode(): Promise<string> {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code: string;
        let attempts = 0;

        do {
            code = '';
            for (let i = 0; i < 12; i++) {
                if (i > 0 && i % 4 === 0) {
                    code += '-';
                }
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            attempts++;

            const existing = await this.giftCardRepo.findOne({
                where: { code },
            });
            if (!existing) {
                return code;
            }
        } while (attempts < 10);

        throw new ConflictException('Failed to generate unique gift card code');
    }

    private async createTransaction(
        giftCardId: number,
        data: Partial<GiftCardTransaction>,
    ): Promise<GiftCardTransaction> {
        const transaction = this.transactionRepo.create({
            giftCardId,
            ...data,
        });
        return this.transactionRepo.save(transaction);
    }

    private getStatusLabel(status: GiftCardStatus): string {
        const labels: Record<GiftCardStatus, string> = {
            [GiftCardStatus.Active]: 'aktywna',
            [GiftCardStatus.Used]: 'wykorzystana',
            [GiftCardStatus.Expired]: 'wygasła',
            [GiftCardStatus.Cancelled]: 'anulowana',
        };
        return labels[status];
    }
}
