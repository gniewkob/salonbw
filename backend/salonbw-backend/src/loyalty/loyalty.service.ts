import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import {
    Repository,
    FindOptionsWhere,
    MoreThanOrEqual,
    LessThanOrEqual,
    Between,
    DataSource,
    EntityManager,
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
import { User } from '../users/user.entity';

const EXPIRE_CHUNK_SIZE = 100;

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
        @InjectDataSource()
        private readonly dataSource: DataSource,
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
            { id: actorId } as unknown as User,
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

        const { saved, finalPoints } = await this.dataSource.transaction(
            async (manager) => {
                const balance = await this.lockOrCreateBalance(
                    dto.userId,
                    manager,
                );

                let pts = dto.points;
                if (balance.tierMultiplier > 1) {
                    pts = Math.floor(pts * Number(balance.tierMultiplier));
                }
                if (
                    program.minPointsPerVisit &&
                    pts < program.minPointsPerVisit
                ) {
                    pts = program.minPointsPerVisit;
                }
                if (
                    program.maxPointsPerVisit &&
                    pts > program.maxPointsPerVisit
                ) {
                    pts = program.maxPointsPerVisit;
                }

                balance.currentBalance += pts;
                balance.totalPointsEarned += pts;
                balance.lifetimeTierPoints += pts;
                this.updateTier(balance, program);
                await manager.getRepository(LoyaltyBalance).save(balance);

                let expiresAt: Date | null = null;
                if (program.pointsExpireMonths) {
                    expiresAt = new Date();
                    expiresAt.setMonth(expiresAt.getMonth() + program.pointsExpireMonths);
                }

                const txRepo = manager.getRepository(LoyaltyTransaction);
                const tx = txRepo.create({
                    userId: dto.userId,
                    type: LoyaltyTransactionType.Earn,
                    source: dto.source,
                    points: pts,
                    balanceAfter: balance.currentBalance,
                    appointmentId: dto.appointmentId,
                    referralUserId: dto.referralUserId,
                    description:
                        dto.description ??
                        this.getDefaultDescription(dto.source),
                    performedById: actorId,
                    expiresAt,
                });
                const saved = await txRepo.save(tx);
                return { saved, finalPoints: pts };
            },
        );

        await this.logService.logAction(
            { id: actorId } as unknown as User,
            LogAction.LOYALTY_POINTS_AWARDED,
            { userId: dto.userId, points: finalPoints, source: dto.source },
        );

        this.logger.log(`Awarded ${finalPoints} points to user ${dto.userId}`);
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
        const saved = await this.dataSource.transaction(async (manager) => {
            const balance = await this.lockOrCreateBalance(userId, manager);

            const newBalance = balance.currentBalance + dto.points;
            if (newBalance < 0) {
                throw new BadRequestException(
                    'Saldo punktów nie może być ujemne',
                );
            }

            balance.currentBalance = newBalance;
            if (dto.points > 0) {
                balance.totalPointsEarned += dto.points;
            } else {
                balance.totalPointsSpent += Math.abs(dto.points);
            }
            await manager.getRepository(LoyaltyBalance).save(balance);

            const txRepo = manager.getRepository(LoyaltyTransaction);
            const tx = txRepo.create({
                userId,
                type: LoyaltyTransactionType.Adjust,
                source: LoyaltyTransactionSource.Manual,
                points: dto.points,
                balanceAfter: newBalance,
                description: dto.description,
                performedById: actorId,
            });
            return txRepo.save(tx);
        });

        await this.logService.logAction(
            { id: actorId } as unknown as User,
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
            { id: actorId } as unknown as User,
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
            { id: actorId } as unknown as User,
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
            { id: actorId } as unknown as User,
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
        // Read reward and program outside the transaction — they are rarely modified
        // and locking them here would increase lock contention.
        const reward = await this.getReward(dto.rewardId);
        const program = await this.getProgram();

        if (!reward.isActive) {
            throw new BadRequestException('Ta nagroda jest nieaktywna');
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

        const savedRedemption = await this.dataSource.transaction(
            async (manager) => {
                // Lock the balance row to prevent concurrent redemptions
                const balance = await this.lockOrCreateBalance(userId, manager);

                if (balance.currentBalance < reward.pointsCost) {
                    throw new BadRequestException(
                        `Niewystarczająca liczba punktów. Potrzebujesz ${reward.pointsCost}, masz ${balance.currentBalance}`,
                    );
                }

                balance.currentBalance -= reward.pointsCost;
                balance.totalPointsSpent += reward.pointsCost;
                await manager.getRepository(LoyaltyBalance).save(balance);

                const txRepo = manager.getRepository(LoyaltyTransaction);
                const tx = txRepo.create({
                    userId,
                    type: LoyaltyTransactionType.Spend,
                    source: LoyaltyTransactionSource.Reward,
                    points: -reward.pointsCost,
                    balanceAfter: balance.currentBalance,
                    rewardId: reward.id,
                    description: `Wymiana na nagrodę: ${reward.name}`,
                    performedById: actorId,
                });
                const savedTx = await txRepo.save(tx);

                // Atomic increment with max limit constraint check to avoid overselling race condition
                if (reward.maxRedemptions) {
                    const updateResult = await manager
                        .getRepository(LoyaltyReward)
                        .createQueryBuilder()
                        .update()
                        .set({ currentRedemptions: () => 'current_redemptions + 1' })
                        .where('id = :id', { id: reward.id })
                        .andWhere('current_redemptions < max_redemptions')
                        .execute();

                    if (updateResult.affected === 0) {
                        throw new BadRequestException(
                            'Ta nagroda została w międzyczasie wyczerpana.',
                        );
                    }
                } else {
                    await manager
                        .getRepository(LoyaltyReward)
                        .increment({ id: reward.id }, 'currentRedemptions', 1);
                }

                const redemptionCode =
                    await this.generateRedemptionCode(manager);
                const expiresAt = new Date(
                    Date.now() + 90 * 24 * 60 * 60 * 1000,
                );

                const redemptionRepo = manager.getRepository(
                    LoyaltyRewardRedemption,
                );
                const redemption = redemptionRepo.create({
                    userId,
                    rewardId: reward.id,
                    pointsSpent: reward.pointsCost,
                    transactionId: savedTx.id,
                    redemptionCode,
                    expiresAt,
                    status: 'active',
                });

                return redemptionRepo.save(redemption);
            },
        );

        await this.logService.logAction(
            { id: actorId } as unknown as User,
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
        const updated = await this.dataSource.transaction(async (manager) => {
            const redemptionRepo = manager.getRepository(LoyaltyRewardRedemption);

            const redemption = await redemptionRepo.findOne({
                where: { redemptionCode: dto.redemptionCode.toUpperCase() },
                relations: ['reward', 'user'],
                lock: { mode: 'pessimistic_write' },
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
                await redemptionRepo.save(redemption);
                throw new BadRequestException('Kupon wygasł');
            }

            redemption.status = 'used';
            redemption.usedAt = new Date();
            if (dto.appointmentId) {
                redemption.usedAppointmentId = dto.appointmentId;
            }
            redemption.processedById = actorId;

            return redemptionRepo.save(redemption);
        });

        await this.logService.logAction(
            { id: actorId } as unknown as User,
            LogAction.LOYALTY_COUPON_USED,
            { redemptionCode: dto.redemptionCode, userId: updated.userId },
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

    /**
     * Lock-or-create the balance row for the given user within an active
     * transaction.  Uses pessimistic_write so concurrent operations on the
     * same user block until the first one commits.
     */
    private async lockOrCreateBalance(
        userId: number,
        manager: EntityManager,
    ): Promise<LoyaltyBalance> {
        const repo = manager.getRepository(LoyaltyBalance);
        let balance = await repo.findOne({
            where: { userId },
            lock: { mode: 'pessimistic_write' },
        });

        if (!balance) {
            try {
                balance = repo.create({
                    userId,
                    currentBalance: 0,
                    totalPointsEarned: 0,
                    totalPointsSpent: 0,
                    lifetimeTierPoints: 0,
                    tierMultiplier: 1.0,
                });
                await repo.save(balance);
            } catch (err: any) {
                // Fail-safe handling for concurrent creation if unique constraint fails
                if (err.code === '23505') { // Postgres duplicate key code
                    balance = await repo.findOne({
                        where: { userId },
                        lock: { mode: 'pessimistic_write' },
                    });
                    if (!balance) throw err;
                } else {
                    throw err;
                }
            }
        }

        return balance;
    }

    private async generateRedemptionCode(
        manager: EntityManager,
    ): Promise<string> {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const repo = manager.getRepository(LoyaltyRewardRedemption);
        let code: string;
        let attempts = 0;

        do {
            code = 'VIP-';
            for (let i = 0; i < 8; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            attempts++;

            const existing = await repo.findOne({
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

    // Cron job for expiring points — processes in chunks to avoid OOM on large datasets
    async expirePoints(): Promise<number> {
        const now = new Date();
        let totalExpired = 0;

        // Since we mark isExpired=true as we go, each iteration fetches the
        // next unseen chunk (skip=0 always returns un-processed rows).
        while (true) {
            const chunk = await this.transactionRepo.find({
                where: {
                    type: LoyaltyTransactionType.Earn,
                    isExpired: false,
                    expiresAt: LessThanOrEqual(now),
                },
                take: EXPIRE_CHUNK_SIZE,
            });

            if (chunk.length === 0) break;

            for (const tx of chunk) {
                try {
                    await this.dataSource.transaction(async (manager) => {
                        await manager
                            .getRepository(LoyaltyTransaction)
                            .update(tx.id, { isExpired: true });

                        const balance = await this.lockOrCreateBalance(
                            tx.userId,
                            manager,
                        );
                        const expireAmount = Math.min(
                            tx.points,
                            balance.currentBalance,
                        );

                        if (expireAmount > 0) {
                            balance.currentBalance -= expireAmount;
                            await manager
                                .getRepository(LoyaltyBalance)
                                .save(balance);

                            await manager.getRepository(LoyaltyTransaction).save(
                                manager.getRepository(LoyaltyTransaction).create({
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
                    });
                } catch (err) {
                    this.logger.error(`Failed to expire points for transaction ${tx.id}`, err);
                    // Pętla kontynuuje pomimo niepowodzenia pojedynczego rekordu.
                }
            }
        }

        if (totalExpired > 0) {
            this.logger.log(`Expired ${totalExpired} loyalty points`);
        }

        return totalExpired;
    }
}
