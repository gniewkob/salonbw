import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import { CreateCrmFollowUpActionDto } from './dto/create-crm-follow-up-action.dto';
import { CrmFollowUpActionsQueryDto } from './dto/crm-follow-up-actions-query.dto';
import { ReceptionFollowUpCandidatesQueryDto } from './dto/reception-follow-up-candidates-query.dto';
import {
    CrmFollowUpActionAuditSummaryResponse,
    CrmFollowUpActionResponse,
    ReceptionFollowUpCandidate,
    ReceptionService,
} from './reception.service';

@ApiTags('crm')
@Controller('crm')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CrmController {
    private static readonly MAX_AUDIT_RANGE_DAYS = 31;

    constructor(private readonly receptionService: ReceptionService) {}

    @Post('follow-up-actions')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Capture CRM follow-up action' })
    createFollowUpAction(
        @Body() dto: CreateCrmFollowUpActionDto,
    ): Promise<CrmFollowUpActionResponse> {
        return this.receptionService.createFollowUpAction(dto);
    }

    @Get('follow-up-actions')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Get follow-up action audit summary for date range' })
    getFollowUpActionAuditSummary(
        @Query() query: CrmFollowUpActionsQueryDto,
    ): Promise<CrmFollowUpActionAuditSummaryResponse> {
        const from = query.from?.trim();
        const to = query.to?.trim();

        if (
            !from ||
            !to ||
            !/^\d{4}-\d{2}-\d{2}$/.test(from) ||
            !/^\d{4}-\d{2}-\d{2}$/.test(to)
        ) {
            throw new BadRequestException(
                'from and to must be provided as YYYY-MM-DD',
            );
        }

        const fromDate = new Date(`${from}T00:00:00.000`);
        const toDate = new Date(`${to}T00:00:00.000`);
        if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
            throw new BadRequestException(
                'from and to must be valid dates in YYYY-MM-DD',
            );
        }
        if (fromDate > toDate) {
            throw new BadRequestException('from cannot be later than to');
        }

        const diffDays =
            Math.floor(
                (toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000),
            ) + 1;
        if (diffDays > CrmController.MAX_AUDIT_RANGE_DAYS) {
            throw new BadRequestException(
                `date range cannot exceed ${CrmController.MAX_AUDIT_RANGE_DAYS} days`,
            );
        }

        return this.receptionService.getFollowUpActionAuditSummary(from, to);
    }

    @Get('follow-up-candidates')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Get CRM follow-up candidates for a day' })
    getFollowUpCandidates(
        @Query() query: ReceptionFollowUpCandidatesQueryDto,
    ): Promise<ReceptionFollowUpCandidate[]> {
        const date = query.date?.trim();
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new BadRequestException(
                'date must be provided as YYYY-MM-DD',
            );
        }

        return this.receptionService.getFollowUpCandidates(date);
    }
}
