import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import { CreateReceptionOperationalEventDto } from './dto/create-reception-operational-event.dto';
import {
    ReceptionOperationalEventResponse,
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
}
