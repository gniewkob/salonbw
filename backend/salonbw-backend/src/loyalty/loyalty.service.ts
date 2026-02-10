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
    MoreThanOrEqual,
    LessThanOrEqual,
    Between,
} from 'typeorm';
import {
    LoyaltyProgram,
    LoyaltyBalance,
    LoyaltyTransaction,
    LoyaltyTransactionType,
    LoyaltyTransactionSource,
    LoyaltyReward,
    LoyaltyRewardRedemption,
    RewardType,
} from './entities/loyalty.entity';
import {
    CreateLoyaltyProgramDto,
    UpdateLoyaltyProgramDto,
    CreateRewardDto,
    UpdateRewardDto,
    AwardPointsDto,
    AdjustPointsDto,
    RedeemRewardDto,
    UseRedemptionDto,
    LoyaltyTransactionQueryDto,
    RewardQueryDto,
    LoyaltyBalanceResponse,
    LoyaltyStatsResponse,
} from './dto/loyalty.dto';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';

@Injectable()
export class LoyaltyService {
    private readonly logger = new Logger(LoyaltyService.name);

    constructor(
        @InjectRepository(LoyaltyProgram)
        private readonly programRepo: Repository<LoyaltyProgram>,
        @InjectRepository(LoyaltyBalance)
        private readonly balanceRepo: Repository<LoyaltyBalance>,
        @InjectRepository(LoyaltyTransaction)
        private readonly transactionRepo: Repository<LoyaltyTransaction>,
        @InjectRepository(LoyaltyReward)
        private readonly rewardRepo: Repository<LoyaltyReward>,
        @InjectRepository(LoyaltyRewardRedemption)
        private readonly redemptionRepo: Repository<LoyaltyRewardRedemption>,
        private readonly logService: LogService,
    ) {}

    // Program Management
    async getProgram(): Promise<LoyaltyProgram> {
        let program = await this.programRepo.findOne({
            where: { isActive: true },
        });
        if (!program) {
            // Create default program
            program = this.programRepo.create({
                name: 'Program Lojalnościowy',
                description:
                    'Zbieraj punkty za każdą wizytę i wymieniaj na nagrody!',
                pointsPerCurrency: 1,
                pointsValueCurrency: 0.01,
                minPointsRedemption: 100,
            });
            await this.programRepo.save(program);
        }
        return program;
    }

    async updateProgram(
        dto: UpdateLoyaltyProgramDto,
        actorId: number,
    ): Promise<LoyaltyProgram> {
        const program = await this.getProgram();
        Object.assign(program, dto);
        const updated = await this.programRepo.save(program);

        await this.logService.logAction(
            { id: actorId } as any,
            LogAction.LOYALTY_PROGRAM_UPDATED,
            { changes: dto },
        );

        return updated;
    }

    // Balance Management
    async getBalance(userId: number): Promise<LoyaltyBalance> {
        let balance = await this.balanceRepo.findOne({
            where: { userId },
            relations: ['user'],
        });

        if (!balance) {
            balance = this.balanceRepo.create({
                userId,
                currentBalance: 0,
                totalPointsEarned: 0,
                totalPointsSpent: 0,
                lifetimeTierPoints: 0,
                tierMultiplier: 1.0,
            });
            await this.balanceRepo.save(balance);
        }

        return balance;
    }

    async getBalanceResponse(userId: number): Promise<LoyaltyBalanceResponse> {
        const balance = await this.getBalance(userId);
        const program = await this.getProgram();

        return {
            userId: balance.userId,
            userName: balance.user?.name ?? '',
            currentBalance: balance.currentBalance,
            totalPointsEarned: balance.totalPointsEarned,
            totalPointsSpent: balance.totalPointsSpent,
            lifetimeTierPoints: balance.lifetimeTierPoints,
            currentTier: balance.currentTier,
            tierMultiplier: Number(balance.tierMultiplier),
            pointsValue:
                balance.currentBalance * Number(program.pointsValueCurrency),
        };
    }

    // Points Operations
    async awardPoints(
        dto: AwardPointsDto,
        actorId: number,
    ): Promise<LoyaltyTransaction> {
        const program = await this.getProgram();
        const balance = await this.getBalance(dto.userId);

        // Apply tier multiplier
        let points = dto.points;
        if (balance.tierMultiplier > 1) {
            points = Math.floor(points * Number(balance.tierMultiplier));
        }

        // Apply min/max constraints
        if (program.minPointsPerVisit && points < program.minPointsPerVisit) {
            points = program.minPointsPerVisit;
        }
        if (program.maxPointsPerVisit && points > program.maxPointsPerVisit) {
            points = program.maxPointsPerVisit;
        }

        // Update balance
        balance.currentBalance += points;
        balance.totalPointsEarned += points;
        balance.lifetimeTierPoints += points;

        // Check for tier upgrade
        this.updateTier(balance, program);

        await this.balanceRepo.save(balance);

        // Create transaction
        const expiresAt = program.pointsExpireMonths
            ? new Date(
                  Date.now() +
                      program.pointsExpireMonths * 30 * 24 * 60 * 60 * 1000,
              )
            : null;

        const transaction = this.transactionRepo.create({
            userId: dto.userId,
            type: LoyaltyTransactionType.Earn,
            source: dto.source,
            points,
            balanceAfter: balance.currentBalance,
            appointmentId: dto.appointmentId,
            referralUserId: dto.referralUserId,
            description:
                dto.description ?? this.getDefaultDescription(dto.source),
            performedById: actorId,
            expiresAt,
        });

        const saved = await this.transactionRepo.save(transaction);

        await this.logService.logAction(
            { id: actorId } as any,
            LogAction.LOYALTY_POINTS_AWARDED,
            { userId: dto.userId, points, source: dto.source },
        );

        this.logger.log(`Awarded ${points} points to user ${dto.userId}`);
        return saved;
    }

    async awardPointsForAppointment(
        userId: number,
        appointmentId: number,
        amountSpent: number,
        actorId: number,
    ): Promise<LoyaltyTransaction | null> {
        const program = await this.getProgram();
        const points = Math.floor(
            amountSpent * Number(program.pointsPerCurrency),
        );

        if (points <= 0) {
            return null;
        }

        return this.awardPoints(
            {
                userId,
                points,
                source: LoyaltyTransactionSource.Appointment,
                appointmentId,
                description: `Punkty za wizytę #${appointmentId}`,
            },
            actorId,
        );
    }

    async adjustPoints(
        userId: number,
        dto: AdjustPointsDto,
        actorId: number,
    ): Promise<LoyaltyTransaction> {
        const balance = await this.getBalance(userId);

        const newBalance = balance.currentBalance + dto.points;
        if (newBalance < 0) {
            throw new BadRequestException('Saldo punktów nie może być ujemne');
        }

        balance.currentBalance = newBalance;
        if (dto.points > 0) {
            balance.totalPointsEarned += dto.points;
        } else {
            balance.totalPointsSpent += Math.abs(dto.points);
        }

        await this.balanceRepo.save(balance);

        const transaction = this.transactionRepo.create({
            userId,
            type: LoyaltyTransactionType.Adjust,
            source: LoyaltyTransactionSource.Manual,
            points: dto.points,
            balanceAfter: newBalance,
            description: dto.description,
            performedById: actorId,
        });

        const saved = await this.transactionRepo.save(transaction);

        await this.logService.logAction(
            { id: actorId } as any,
            LogAction.LOYALTY_POINTS_ADJUSTED,
            { userId, points: dto.points, description: dto.description },
        );

        return saved;
    }

    // Reward Management
    async getRewards(
        query: RewardQueryDto,
    ): Promise<{ data: LoyaltyReward[]; total: number }> {
        const where: FindOptionsWhere<LoyaltyReward> = {};
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;

        if (query.type) {
            where.type = query.type;
        }
        if (query.isActive !== undefined) {
            where.isActive = query.isActive;
        }

        const [data, total] = await this.rewardRepo.findAndCount({
            where,
            order: { sortOrder: 'ASC', pointsCost: 'ASC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { data, total };
    }

    async getAvailableRewards(userId: number): Promise<LoyaltyReward[]> {
        const balance = await this.getBalance(userId);
        const now = new Date();

        const rewards = await this.rewardRepo
            .createQueryBuilder('r')
            .where('r.isActive = true')
            .andWhere('r.pointsCost <= :points', {
                points: balance.currentBalance,
            })
            .andWhere('(r.availableFrom IS NULL OR r.availableFrom <= :now)', {
                now,
            })
            .andWhere(
                '(r.availableUntil IS NULL OR r.availableUntil >= :now)',
                { now },
            )
            .andWhere(
                '(r.maxRedemptions IS NULL OR r.currentRedemptions < r.maxRedemptions)',
            )
            .orderBy('r.sortOrder', 'ASC')
            .addOrderBy('r.pointsCost', 'ASC')
            .getMany();

        return rewards;
    }

    async getReward(id: number): Promise<LoyaltyReward> {
        const reward = await this.rewardRepo.findOne({ where: { id } });
        if (!reward) {
            throw new NotFoundException(`Nagroda o ID ${id} nie istnieje`);
        }
        return reward;
    }

    async createReward(
        dto: CreateRewardDto,
        actorId: number,
    ): Promise<LoyaltyReward> {
        const reward = this.rewardRepo.create(dto);
        if (dto.availableFrom) {
            reward.availableFrom = new Date(dto.availableFrom);
        }
        if (dto.availableUntil) {
            reward.availableUntil = new Date(dto.availableUntil);
        }

        const saved = await this.rewardRepo.save(reward);

        await this.logService.logAction(
            { id: actorId } as any,
            LogAction.LOYALTY_REWARD_CREATED,
            { rewardId: saved.id, name: saved.name },
        );

        return saved;
    }

    async updateReward(
        id: number,
        dto: UpdateRewardDto,
        actorId: number,
    ): Promise<LoyaltyReward> {
        const reward = await this.getReward(id);

        Object.assign(reward, dto);
        if (dto.availableFrom) {
            reward.availableFrom = new Date(dto.availableFrom);
        }
        if (dto.availableUntil) {
            reward.availableUntil = new Date(dto.availableUntil);
        }

        const updated = await this.rewardRepo.save(reward);

        await this.logService.logAction(
            { id: actorId } as any,
            LogAction.LOYALTY_REWARD_UPDATED,
            { rewardId: id, changes: dto },
        );

        return updated;
    }

    async deleteReward(id: number, actorId: number): Promise<void> {
        const reward = await this.getReward(id);
        reward.isActive = false;
        await this.rewardRepo.save(reward);

        await this.logService.logAction(
            { id: actorId } as any,
            LogAction.LOYALTY_REWARD_DELETED,
            { rewardId: id, name: reward.name },
        );
    }

    // Redemption
    async redeemReward(
        userId: number,
        dto: RedeemRewardDto,
        actorId: number,
    ): Promise<LoyaltyRewardRedemption> {
        const reward = await this.getReward(dto.rewardId);
        const balance = await this.getBalance(userId);
        const program = await this.getProgram();

        // Validations
        if (!reward.isActive) {
            throw new BadRequestException('Ta nagroda jest nieaktywna');
        }

        if (balance.currentBalance < reward.pointsCost) {
            throw new BadRequestException(
                `Niewystarczająca liczba punktów. Potrzebujesz ${reward.pointsCost}, masz ${balance.currentBalance}`,
            );
        }

        if (reward.pointsCost < program.minPointsRedemption) {
            throw new BadRequestException(
                `Minimalna liczba punktów do wymiany to ${program.minPointsRedemption}`,
            );
        }

        const now = new Date();
        if (reward.availableFrom && reward.availableFrom > now) {
            throw new BadRequestException(
                'Ta nagroda nie jest jeszcze dostępna',
            );
        }
        if (reward.availableUntil && reward.availableUntil < now) {
            throw new BadRequestException('Ta nagroda już wygasła');
        }
        if (
            reward.maxRedemptions &&
            reward.currentRedemptions >= reward.maxRedemptions
        ) {
            throw new BadRequestException(
                'Ta nagroda została już wykorzystana maksymalną liczbę razy',
            );
        }

        // Deduct points
        balance.currentBalance -= reward.pointsCost;
        balance.totalPointsSpent += reward.pointsCost;
        await this.balanceRepo.save(balance);

        // Create transaction
        const transaction = this.transactionRepo.create({
            userId,
            type: LoyaltyTransactionType.Spend,
            source: LoyaltyTransactionSource.Reward,
            points: -reward.pointsCost,
            balanceAfter: balance.currentBalance,
            rewardId: reward.id,
            description: `Wymiana na nagrodę: ${reward.name}`,
            performedById: actorId,
        });
        const savedTx = await this.transactionRepo.save(transaction);

        // Update reward redemption count
        reward.currentRedemptions += 1;
        await this.rewardRepo.save(reward);

        // Create redemption record
        const redemptionCode = await this.generateRedemptionCode();
        const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

        const redemption = this.redemptionRepo.create({
            userId,
            rewardId: reward.id,
            pointsSpent: reward.pointsCost,
            transactionId: savedTx.id,
            redemptionCode,
            expiresAt,
            status: 'active',
        });

        const savedRedemption = await this.redemptionRepo.save(redemption);

        await this.logService.logAction(
            { id: actorId } as any,
            LogAction.LOYALTY_REWARD_REDEEMED,
            {
                userId,
                rewardId: reward.id,
                rewardName: reward.name,
                pointsSpent: reward.pointsCost,
            },
        );

        this.logger.log(
            `User ${userId} redeemed reward ${reward.name} for ${reward.pointsCost} points`,
        );
        return savedRedemption;
    }

    async useRedemption(
        dto: UseRedemptionDto,
        actorId: number,
    ): Promise<LoyaltyRewardRedemption> {
        const redemption = await this.redemptionRepo.findOne({
            where: { redemptionCode: dto.redemptionCode.toUpperCase() },
            relations: ['reward', 'user'],
        });

        if (!redemption) {
            throw new NotFoundException('Kupon nie istnieje');
        }

        if (redemption.status !== 'active') {
            throw new BadRequestException(
                `Kupon jest już ${redemption.status === 'used' ? 'wykorzystany' : redemption.status}`,
            );
        }

        if (redemption.expiresAt && redemption.expiresAt < new Date()) {
            redemption.status = 'expired';
            await this.redemptionRepo.save(redemption);
            throw new BadRequestException('Kupon wygasł');
        }

        redemption.status = 'used';
        redemption.usedAt = new Date();
        if (dto.appointmentId) {
            redemption.usedAppointmentId = dto.appointmentId;
        }
        redemption.processedById = actorId;

        const updated = await this.redemptionRepo.save(redemption);

        await this.logService.logAction(
            { id: actorId } as any,
            LogAction.LOYALTY_COUPON_USED,
            { redemptionCode: dto.redemptionCode, userId: redemption.userId },
        );

        return updated;
    }

    async getUserRedemptions(
        userId: number,
    ): Promise<LoyaltyRewardRedemption[]> {
        return this.redemptionRepo.find({
            where: { userId },
            relations: ['reward'],
            order: { createdAt: 'DESC' },
        });
    }

    // Transactions
    async getTransactions(
        query: LoyaltyTransactionQueryDto,
    ): Promise<{ data: LoyaltyTransaction[]; total: number }> {
        const where: FindOptionsWhere<LoyaltyTransaction> = {};
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;

        if (query.userId) {
            where.userId = query.userId;
        }
        if (query.type) {
            where.type = query.type;
        }
        if (query.source) {
            where.source = query.source;
        }

        const [data, total] = await this.transactionRepo.findAndCount({
            where,
            relations: ['user', 'performedBy'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { data, total };
    }

    async getUserTransactions(
        userId: number,
        limit = 50,
    ): Promise<LoyaltyTransaction[]> {
        return this.transactionRepo.find({
            where: { userId },
            relations: ['performedBy'],
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }

    // Statistics
    async getStats(): Promise<LoyaltyStatsResponse> {
        const program = await this.getProgram();

        const [
            totalMembers,
            totalPointsIssued,
            totalPointsRedeemed,
            totalRewardsRedeemed,
        ] = await Promise.all([
            this.balanceRepo.count(),
            this.balanceRepo
                .createQueryBuilder('b')
                .select('SUM(b.totalPointsEarned)', 'sum')
                .getRawOne(),
            this.balanceRepo
                .createQueryBuilder('b')
                .select('SUM(b.totalPointsSpent)', 'sum')
                .getRawOne(),
            this.redemptionRepo.count({ where: { status: 'used' } }),
        ]);

        const activeMembers = await this.balanceRepo.count({
            where: { currentBalance: MoreThanOrEqual(1) },
        });

        const outstandingPoints =
            Number(totalPointsIssued?.sum || 0) -
            Number(totalPointsRedeemed?.sum || 0);

        return {
            totalMembers,
            activeMembers,
            totalPointsIssued: Number(totalPointsIssued?.sum || 0),
            totalPointsRedeemed: Number(totalPointsRedeemed?.sum || 0),
            totalRewardsRedeemed,
            outstandingPoints,
            outstandingValue:
                outstandingPoints * Number(program.pointsValueCurrency),
        };
    }

    // Helpers
    private updateTier(balance: LoyaltyBalance, program: LoyaltyProgram): void {
        if (!program.enableTiers || !program.tierThresholds?.length) {
            return;
        }

        const sortedTiers = [...program.tierThresholds].sort(
            (a, b) => b.minPoints - a.minPoints,
        );

        for (const tier of sortedTiers) {
            if (balance.lifetimeTierPoints >= tier.minPoints) {
                balance.currentTier = tier.name;
                balance.tierMultiplier = tier.multiplier;
                return;
            }
        }
    }

    private getDefaultDescription(source: LoyaltyTransactionSource): string {
        const descriptions: Record<LoyaltyTransactionSource, string> = {
            [LoyaltyTransactionSource.Appointment]: 'Punkty za wizytę',
            [LoyaltyTransactionSource.ProductPurchase]:
                'Punkty za zakup produktu',
            [LoyaltyTransactionSource.Reward]: 'Wymiana na nagrodę',
            [LoyaltyTransactionSource.Birthday]: 'Bonus urodzinowy',
            [LoyaltyTransactionSource.Referral]: 'Bonus za polecenie',
            [LoyaltyTransactionSource.Signup]: 'Bonus powitalny',
            [LoyaltyTransactionSource.Manual]: 'Korekta manualna',
            [LoyaltyTransactionSource.Expiration]: 'Wygaśnięcie punktów',
        };
        return descriptions[source];
    }

    private async generateRedemptionCode(): Promise<string> {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code: string;
        let attempts = 0;

        do {
            code = 'VIP-';
            for (let i = 0; i < 8; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            attempts++;

            const existing = await this.redemptionRepo.findOne({
                where: { redemptionCode: code },
            });
            if (!existing) {
                return code;
            }
        } while (attempts < 10);

        throw new ConflictException(
            'Nie udało się wygenerować unikalnego kodu',
        );
    }

    // Cron job for expiring points
    async expirePoints(): Promise<number> {
        const now = new Date();

        const expiredTransactions = await this.transactionRepo.find({
            where: {
                type: LoyaltyTransactionType.Earn,
                isExpired: false,
                expiresAt: LessThanOrEqual(now),
            },
        });

        let totalExpired = 0;

        for (const tx of expiredTransactions) {
            tx.isExpired = true;
            await this.transactionRepo.save(tx);

            const balance = await this.getBalance(tx.userId);
            const expireAmount = Math.min(tx.points, balance.currentBalance);

            if (expireAmount > 0) {
                balance.currentBalance -= expireAmount;
                await this.balanceRepo.save(balance);

                await this.transactionRepo.save(
                    this.transactionRepo.create({
                        userId: tx.userId,
                        type: LoyaltyTransactionType.Expire,
                        source: LoyaltyTransactionSource.Expiration,
                        points: -expireAmount,
                        balanceAfter: balance.currentBalance,
                        description: 'Wygaśnięcie punktów',
                    }),
                );

                totalExpired += expireAmount;
            }
        }

        if (totalExpired > 0) {
            this.logger.log(`Expired ${totalExpired} loyalty points`);
        }

        return totalExpired;
    }
}
