import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Newsletter, NewsletterStatus, NewsletterChannel } from './entities/newsletter.entity';
import { NewsletterRecipient, RecipientStatus } from './entities/newsletter-recipient.entity';
import { User } from '../users/user.entity';
import {
    CreateNewsletterDto,
    UpdateNewsletterDto,
    NewsletterResponseDto,
    NewsletterRecipientResponseDto,
    NewsletterStatsDto,
    RecipientFilterDto,
    RecipientPreviewResponseDto,
} from './dto/newsletter.dto';

@Injectable()
export class NewslettersService {
    constructor(
        @InjectRepository(Newsletter)
        private readonly newsletterRepository: Repository<Newsletter>,
        @InjectRepository(NewsletterRecipient)
        private readonly recipientRepository: Repository<NewsletterRecipient>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async findAll(): Promise<NewsletterResponseDto[]> {
        const newsletters = await this.newsletterRepository.find({
            relations: ['createdBy', 'sentBy'],
            order: { createdAt: 'DESC' },
        });

        return newsletters.map((n) => this.mapToResponseDto(n));
    }

    async findOne(id: number): Promise<NewsletterResponseDto> {
        const newsletter = await this.newsletterRepository.findOne({
            where: { id },
            relations: ['createdBy', 'sentBy'],
        });

        if (!newsletter) {
            throw new NotFoundException(`Newsletter #${id} not found`);
        }

        return this.mapToResponseDto(newsletter);
    }

    async create(dto: CreateNewsletterDto, actor: User): Promise<NewsletterResponseDto> {
        const newsletter = this.newsletterRepository.create({
            name: dto.name,
            subject: dto.subject,
            content: dto.content,
            plainTextContent: dto.plainTextContent,
            channel: dto.channel ?? NewsletterChannel.Email,
            status: NewsletterStatus.Draft,
            recipientFilter: dto.recipientFilter
                ? JSON.stringify(dto.recipientFilter)
                : null,
            recipientIds: dto.recipientIds ? JSON.stringify(dto.recipientIds) : null,
            scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
            createdBy: { id: actor.id },
        });

        const saved = await this.newsletterRepository.save(newsletter);
        return this.findOne(saved.id);
    }

    async update(
        id: number,
        dto: UpdateNewsletterDto,
    ): Promise<NewsletterResponseDto> {
        const newsletter = await this.newsletterRepository.findOne({
            where: { id },
        });

        if (!newsletter) {
            throw new NotFoundException(`Newsletter #${id} not found`);
        }

        if (newsletter.status !== NewsletterStatus.Draft) {
            throw new BadRequestException('Only draft newsletters can be edited');
        }

        if (dto.name !== undefined) newsletter.name = dto.name;
        if (dto.subject !== undefined) newsletter.subject = dto.subject;
        if (dto.content !== undefined) newsletter.content = dto.content;
        if (dto.plainTextContent !== undefined)
            newsletter.plainTextContent = dto.plainTextContent;
        if (dto.channel !== undefined) newsletter.channel = dto.channel;
        if (dto.recipientFilter !== undefined)
            newsletter.recipientFilter = JSON.stringify(dto.recipientFilter);
        if (dto.recipientIds !== undefined)
            newsletter.recipientIds = JSON.stringify(dto.recipientIds);
        if (dto.scheduledAt !== undefined)
            newsletter.scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;

        await this.newsletterRepository.save(newsletter);
        return this.findOne(id);
    }

    async delete(id: number): Promise<void> {
        const newsletter = await this.newsletterRepository.findOne({
            where: { id },
        });

        if (!newsletter) {
            throw new NotFoundException(`Newsletter #${id} not found`);
        }

        if (
            newsletter.status === NewsletterStatus.Sending ||
            newsletter.status === NewsletterStatus.Sent
        ) {
            throw new BadRequestException('Cannot delete a sent or sending newsletter');
        }

        await this.newsletterRepository.remove(newsletter);
    }

    async duplicate(id: number, actor: User): Promise<NewsletterResponseDto> {
        const original = await this.newsletterRepository.findOne({
            where: { id },
        });

        if (!original) {
            throw new NotFoundException(`Newsletter #${id} not found`);
        }

        const copy = this.newsletterRepository.create({
            name: `${original.name} (kopia)`,
            subject: original.subject,
            content: original.content,
            plainTextContent: original.plainTextContent,
            channel: original.channel,
            status: NewsletterStatus.Draft,
            recipientFilter: original.recipientFilter,
            recipientIds: original.recipientIds,
            createdBy: { id: actor.id },
        });

        const saved = await this.newsletterRepository.save(copy);
        return this.findOne(saved.id);
    }

    async previewRecipients(
        filter?: RecipientFilterDto,
        recipientIds?: number[],
    ): Promise<RecipientPreviewResponseDto> {
        const recipients = await this.findRecipients(filter, recipientIds);

        return {
            totalCount: recipients.length,
            recipients: recipients.slice(0, 100).map((r) => ({
                id: r.id,
                name: r.name,
                email: r.email,
            })),
        };
    }

    async send(id: number, actor: User, scheduledAt?: Date): Promise<NewsletterResponseDto> {
        const newsletter = await this.newsletterRepository.findOne({
            where: { id },
        });

        if (!newsletter) {
            throw new NotFoundException(`Newsletter #${id} not found`);
        }

        if (newsletter.status !== NewsletterStatus.Draft) {
            throw new BadRequestException('Only draft newsletters can be sent');
        }

        // Parse filter and recipient IDs
        const filter = newsletter.recipientFilter
            ? (JSON.parse(newsletter.recipientFilter) as RecipientFilterDto)
            : undefined;
        const recipientIds = newsletter.recipientIds
            ? (JSON.parse(newsletter.recipientIds) as number[])
            : undefined;

        // Find recipients
        const recipients = await this.findRecipients(filter, recipientIds);

        if (recipients.length === 0) {
            throw new BadRequestException('No recipients found for this newsletter');
        }

        // Update newsletter status
        if (scheduledAt && scheduledAt > new Date()) {
            newsletter.status = NewsletterStatus.Scheduled;
            newsletter.scheduledAt = scheduledAt;
        } else {
            newsletter.status = NewsletterStatus.Sending;
            newsletter.sentAt = new Date();
        }

        newsletter.totalRecipients = recipients.length;
        newsletter.sentBy = { id: actor.id } as User;
        newsletter.sentById = actor.id;

        await this.newsletterRepository.save(newsletter);

        // Create recipient records
        const recipientEntities = recipients.map((r) =>
            this.recipientRepository.create({
                newsletter: { id: newsletter.id },
                newsletterId: newsletter.id,
                recipient: { id: r.id },
                recipientId: r.id,
                recipientEmail: r.email,
                recipientName: r.name,
                status: RecipientStatus.Pending,
            }),
        );

        await this.recipientRepository.save(recipientEntities);

        // If not scheduled, process sends (in a real app, this would be a queue job)
        if (newsletter.status === NewsletterStatus.Sending) {
            await this.processNewsletter(newsletter.id);
        }

        return this.findOne(id);
    }

    async cancel(id: number): Promise<NewsletterResponseDto> {
        const newsletter = await this.newsletterRepository.findOne({
            where: { id },
        });

        if (!newsletter) {
            throw new NotFoundException(`Newsletter #${id} not found`);
        }

        if (
            newsletter.status !== NewsletterStatus.Scheduled &&
            newsletter.status !== NewsletterStatus.Sending
        ) {
            throw new BadRequestException(
                'Only scheduled or sending newsletters can be cancelled',
            );
        }

        newsletter.status = NewsletterStatus.Cancelled;
        await this.newsletterRepository.save(newsletter);

        return this.findOne(id);
    }

    async getRecipients(
        id: number,
        status?: RecipientStatus,
    ): Promise<NewsletterRecipientResponseDto[]> {
        const query = this.recipientRepository
            .createQueryBuilder('recipient')
            .where('recipient.newsletterId = :id', { id })
            .orderBy('recipient.createdAt', 'ASC');

        if (status) {
            query.andWhere('recipient.status = :status', { status });
        }

        const recipients = await query.getMany();

        return recipients.map((r) => ({
            id: r.id,
            recipientId: r.recipientId,
            recipientEmail: r.recipientEmail,
            recipientName: r.recipientName,
            status: r.status,
            sentAt: r.sentAt?.toISOString() ?? null,
            deliveredAt: r.deliveredAt?.toISOString() ?? null,
            openedAt: r.openedAt?.toISOString() ?? null,
            clickedAt: r.clickedAt?.toISOString() ?? null,
            errorMessage: r.errorMessage,
        }));
    }

    async getStats(): Promise<NewsletterStatsDto> {
        const [totalNewsletters, sentNewsletters, draftNewsletters] =
            await Promise.all([
                this.newsletterRepository.count(),
                this.newsletterRepository.count({
                    where: { status: NewsletterStatus.Sent },
                }),
                this.newsletterRepository.count({
                    where: { status: NewsletterStatus.Draft },
                }),
            ]);

        const aggregates = await this.newsletterRepository
            .createQueryBuilder('n')
            .select('SUM(n.totalRecipients)', 'totalRecipients')
            .addSelect('SUM(n.deliveredCount)', 'totalDelivered')
            .addSelect('SUM(n.openedCount)', 'totalOpened')
            .addSelect('SUM(n.clickedCount)', 'totalClicked')
            .where('n.status IN (:...statuses)', {
                statuses: [NewsletterStatus.Sent, NewsletterStatus.PartialFailure],
            })
            .getRawOne();

        const totalRecipients = Number(aggregates?.totalRecipients ?? 0);
        const totalDelivered = Number(aggregates?.totalDelivered ?? 0);
        const totalOpened = Number(aggregates?.totalOpened ?? 0);
        const totalClicked = Number(aggregates?.totalClicked ?? 0);

        return {
            totalNewsletters,
            sentNewsletters,
            draftNewsletters,
            totalRecipients,
            totalDelivered,
            totalOpened,
            totalClicked,
            averageOpenRate:
                totalDelivered > 0
                    ? Math.round((totalOpened / totalDelivered) * 100)
                    : 0,
            averageClickRate:
                totalOpened > 0
                    ? Math.round((totalClicked / totalOpened) * 100)
                    : 0,
        };
    }

    // Private methods

    private async findRecipients(
        filter?: RecipientFilterDto,
        recipientIds?: number[],
    ): Promise<User[]> {
        const query = this.userRepository
            .createQueryBuilder('user')
            .where('user.role = :role', { role: 'client' })
            .andWhere('user.email IS NOT NULL');

        // If specific IDs provided, use those
        if (recipientIds && recipientIds.length > 0) {
            query.andWhere('user.id IN (:...ids)', { ids: recipientIds });
        }

        // Apply filters
        if (filter) {
            if (filter.hasEmailConsent !== undefined) {
                query.andWhere('user.emailConsent = :emailConsent', {
                    emailConsent: filter.hasEmailConsent,
                });
            }

            if (filter.hasSmsConsent !== undefined) {
                query.andWhere('user.smsConsent = :smsConsent', {
                    smsConsent: filter.hasSmsConsent,
                });
            }

            if (filter.gender) {
                query.andWhere('user.gender = :gender', { gender: filter.gender });
            }

            if (filter.groupIds && filter.groupIds.length > 0) {
                query.innerJoin('user.groups', 'group');
                query.andWhere('group.id IN (:...groupIds)', {
                    groupIds: filter.groupIds,
                });
            }

            if (filter.tagIds && filter.tagIds.length > 0) {
                query.innerJoin('user.tags', 'tag');
                query.andWhere('tag.id IN (:...tagIds)', { tagIds: filter.tagIds });
            }
        }

        return query.getMany();
    }

    private async processNewsletter(id: number): Promise<void> {
        // In a real implementation, this would be handled by a job queue (Bull, etc.)
        // For now, we'll simulate immediate sending

        const recipients = await this.recipientRepository.find({
            where: { newsletterId: id, status: RecipientStatus.Pending },
        });

        let sentCount = 0;
        let failedCount = 0;

        for (const recipient of recipients) {
            try {
                // Simulate email sending (in real app, use email service)
                // await this.emailService.send(recipient.recipientEmail, subject, content);

                recipient.status = RecipientStatus.Sent;
                recipient.sentAt = new Date();
                sentCount++;
            } catch (error) {
                recipient.status = RecipientStatus.Failed;
                recipient.errorMessage =
                    error instanceof Error ? error.message : 'Unknown error';
                failedCount++;
            }

            await this.recipientRepository.save(recipient);
        }

        // Update newsletter stats
        const newsletter = await this.newsletterRepository.findOne({
            where: { id },
        });

        if (newsletter) {
            newsletter.sentCount = sentCount;
            newsletter.failedCount = failedCount;
            newsletter.status =
                failedCount === 0
                    ? NewsletterStatus.Sent
                    : failedCount === recipients.length
                      ? NewsletterStatus.Failed
                      : NewsletterStatus.PartialFailure;

            await this.newsletterRepository.save(newsletter);
        }
    }

    private mapToResponseDto(newsletter: Newsletter): NewsletterResponseDto {
        return {
            id: newsletter.id,
            name: newsletter.name,
            subject: newsletter.subject,
            content: newsletter.content,
            plainTextContent: newsletter.plainTextContent,
            channel: newsletter.channel,
            status: newsletter.status,
            scheduledAt: newsletter.scheduledAt?.toISOString() ?? null,
            sentAt: newsletter.sentAt?.toISOString() ?? null,
            totalRecipients: newsletter.totalRecipients,
            sentCount: newsletter.sentCount,
            deliveredCount: newsletter.deliveredCount,
            failedCount: newsletter.failedCount,
            openedCount: newsletter.openedCount,
            clickedCount: newsletter.clickedCount,
            recipientFilter: newsletter.recipientFilter
                ? JSON.parse(newsletter.recipientFilter)
                : null,
            recipientIds: newsletter.recipientIds
                ? JSON.parse(newsletter.recipientIds)
                : null,
            createdBy: newsletter.createdBy
                ? { id: newsletter.createdBy.id, name: newsletter.createdBy.name }
                : null,
            sentBy: newsletter.sentBy
                ? { id: newsletter.sentBy.id, name: newsletter.sentBy.name }
                : null,
            createdAt: newsletter.createdAt.toISOString(),
            updatedAt: newsletter.updatedAt.toISOString(),
        };
    }
}
