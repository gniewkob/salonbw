import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';
import { NewslettersService } from './newsletters.service';
import {
    CreateNewsletterDto,
    UpdateNewsletterDto,
    NewsletterResponseDto,
    NewsletterRecipientResponseDto,
    NewsletterStatsDto,
    SendNewsletterDto,
    PreviewRecipientsDto,
    RecipientPreviewResponseDto,
} from './dto/newsletter.dto';
import { RecipientStatus } from './entities/newsletter-recipient.entity';

@Controller('newsletters')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class NewslettersController {
    constructor(private readonly newslettersService: NewslettersService) {}

    /**
     * Get all newsletters
     */
    @Get()
    @Roles(Role.Admin)
    async findAll(): Promise<NewsletterResponseDto[]> {
        return this.newslettersService.findAll();
    }

    /**
     * Get newsletter statistics
     */
    @Get('stats')
    @Roles(Role.Admin)
    async getStats(): Promise<NewsletterStatsDto> {
        return this.newslettersService.getStats();
    }

    /**
     * Preview recipients based on filter criteria
     */
    @Post('preview-recipients')
    @Roles(Role.Admin)
    async previewRecipients(
        @Body() dto: PreviewRecipientsDto,
    ): Promise<RecipientPreviewResponseDto> {
        return this.newslettersService.previewRecipients(
            dto.recipientFilter,
            dto.recipientIds,
        );
    }

    /**
     * Get a single newsletter by ID
     */
    @Get(':id')
    @Roles(Role.Admin)
    async findOne(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<NewsletterResponseDto> {
        return this.newslettersService.findOne(id);
    }

    /**
     * Create a new newsletter
     */
    @Post()
    @Roles(Role.Admin)
    async create(
        @Body() dto: CreateNewsletterDto,
        @CurrentUser() user: User,
    ): Promise<NewsletterResponseDto> {
        return this.newslettersService.create(dto, user);
    }

    /**
     * Update a newsletter (draft only)
     */
    @Put(':id')
    @Roles(Role.Admin)
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateNewsletterDto,
    ): Promise<NewsletterResponseDto> {
        return this.newslettersService.update(id, dto);
    }

    /**
     * Delete a newsletter (draft only)
     */
    @Delete(':id')
    @Roles(Role.Admin)
    async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.newslettersService.delete(id);
    }

    /**
     * Duplicate a newsletter
     */
    @Post(':id/duplicate')
    @Roles(Role.Admin)
    async duplicate(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: User,
    ): Promise<NewsletterResponseDto> {
        return this.newslettersService.duplicate(id, user);
    }

    /**
     * Send a newsletter (or schedule for later)
     */
    @Post(':id/send')
    @Roles(Role.Admin)
    async send(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: SendNewsletterDto,
        @CurrentUser() user: User,
    ): Promise<NewsletterResponseDto> {
        const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : undefined;
        return this.newslettersService.send(id, user, scheduledAt);
    }

    /**
     * Cancel a scheduled or sending newsletter
     */
    @Post(':id/cancel')
    @Roles(Role.Admin)
    async cancel(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<NewsletterResponseDto> {
        return this.newslettersService.cancel(id);
    }

    /**
     * Get recipients for a newsletter
     */
    @Get(':id/recipients')
    @Roles(Role.Admin)
    async getRecipients(
        @Param('id', ParseIntPipe) id: number,
        @Query('status') status?: RecipientStatus,
    ): Promise<NewsletterRecipientResponseDto[]> {
        return this.newslettersService.getRecipients(id, status);
    }
}
