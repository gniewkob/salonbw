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
import { CreateReceptionOperationalEventDto } from './dto/create-reception-operational-event.dto';
import { ReceptionOperationalSummaryQueryDto } from './dto/reception-operational-summary-query.dto';
import {
    ReceptionOperationalEventResponse,
    ReceptionOperationalSummaryResponse,
    ReceptionService,
} from './reception.service';

@ApiTags('reception')
@Controller('reception')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ReceptionController {
    constructor(private readonly receptionService: ReceptionService) {}

    @Post('operational-events')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Capture reception operational event' })
    createOperationalEvent(
        @Body() dto: CreateReceptionOperationalEventDto,
    ): Promise<ReceptionOperationalEventResponse> {
        return this.receptionService.createOperationalEvent(dto);
    }

    @Get('operational-summary')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Get reception operational summary for a day' })
    getOperationalSummary(
        @Query() query: ReceptionOperationalSummaryQueryDto,
    ): Promise<ReceptionOperationalSummaryResponse> {
        const date = query.date?.trim();
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new BadRequestException(
                'date must be provided as YYYY-MM-DD',
            );
        }
        return this.receptionService.getOperationalSummary(date);
    }
}
