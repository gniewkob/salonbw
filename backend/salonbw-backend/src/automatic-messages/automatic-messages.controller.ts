import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Param,
    Body,
    ParseIntPipe,
    UseGuards,
    Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { AutomaticMessagesService } from './automatic-messages.service';
import {
    CreateAutomaticMessageRuleDto,
    UpdateAutomaticMessageRuleDto,
    AutomaticMessageRuleResponseDto,
    ProcessAutomaticMessagesResultDto,
} from './dto/automatic-message.dto';
import { AutomaticMessageRule } from './entities/automatic-message-rule.entity';

interface AuthenticatedRequest extends Request {
    user: { userId: number; role: Role };
}

@Controller('automatic-messages')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AutomaticMessagesController {
    constructor(
        private readonly automaticMessagesService: AutomaticMessagesService,
    ) {}

    @Get()
    @Roles(Role.Admin)
    async findAll(): Promise<AutomaticMessageRuleResponseDto[]> {
        const rules = await this.automaticMessagesService.findAll();
        return rules.map((rule) => this.mapToResponse(rule));
    }

    @Get(':id')
    @Roles(Role.Admin)
    async findOne(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<AutomaticMessageRuleResponseDto> {
        const rule = await this.automaticMessagesService.findOne(id);
        return this.mapToResponse(rule);
    }

    @Post()
    @Roles(Role.Admin)
    async create(
        @Body() dto: CreateAutomaticMessageRuleDto,
        @Request() req: AuthenticatedRequest,
    ): Promise<AutomaticMessageRuleResponseDto> {
        const rule = await this.automaticMessagesService.create(
            dto,
            req.user.userId,
        );
        return this.mapToResponse(rule);
    }

    @Put(':id')
    @Roles(Role.Admin)
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateAutomaticMessageRuleDto,
    ): Promise<AutomaticMessageRuleResponseDto> {
        const rule = await this.automaticMessagesService.update(id, dto);
        return this.mapToResponse(rule);
    }

    @Patch(':id/toggle')
    @Roles(Role.Admin)
    async toggle(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<AutomaticMessageRuleResponseDto> {
        const rule = await this.automaticMessagesService.toggle(id);
        return this.mapToResponse(rule);
    }

    @Delete(':id')
    @Roles(Role.Admin)
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.automaticMessagesService.remove(id);
    }

    // Manual trigger for testing or immediate processing
    @Post('process')
    @Roles(Role.Admin)
    async processAll(): Promise<ProcessAutomaticMessagesResultDto[]> {
        return this.automaticMessagesService.processAllRules();
    }

    @Post(':id/process')
    @Roles(Role.Admin)
    async processOne(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<ProcessAutomaticMessagesResultDto> {
        const rule = await this.automaticMessagesService.findOne(id);
        return this.automaticMessagesService.processRule(rule);
    }

    private mapToResponse(
        rule: AutomaticMessageRule,
    ): AutomaticMessageRuleResponseDto {
        return {
            id: rule.id,
            name: rule.name,
            description: rule.description,
            trigger: rule.trigger,
            channel: rule.channel,
            offsetHours: rule.offsetHours,
            inactivityDays: rule.inactivityDays,
            sendWindowStart: rule.sendWindowStart,
            sendWindowEnd: rule.sendWindowEnd,
            templateId: rule.templateId,
            templateName: rule.template?.name ?? null,
            content: rule.content,
            serviceIds: rule.serviceIds,
            employeeIds: rule.employeeIds,
            requireSmsConsent: rule.requireSmsConsent,
            requireEmailConsent: rule.requireEmailConsent,
            isActive: rule.isActive,
            sentCount: rule.sentCount,
            lastSentAt: rule.lastSentAt?.toISOString() ?? null,
            createdAt: rule.createdAt.toISOString(),
            updatedAt: rule.updatedAt.toISOString(),
        };
    }
}
