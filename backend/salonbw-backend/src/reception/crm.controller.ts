import {
    BadRequestException,
    Controller,
    Get,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import { ReceptionFollowUpCandidatesQueryDto } from './dto/reception-follow-up-candidates-query.dto';
import {
    ReceptionFollowUpCandidate,
    ReceptionService,
} from './reception.service';

@ApiTags('crm')
@Controller('crm')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CrmController {
    constructor(private readonly receptionService: ReceptionService) {}

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
