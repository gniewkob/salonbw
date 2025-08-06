import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { CommunicationsService } from './communications.service';
import { CreateCommunicationDto } from './dto/create-communication.dto';

@ApiTags('Communications')
@ApiBearerAuth()
@Controller('communications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommunicationsController {
    constructor(private readonly service: CommunicationsService) {}

    @Get(':customerId')
    @Roles(Role.Employee, Role.Admin)
    @ApiOperation({ summary: 'List communications for customer' })
    @ApiResponse({ status: 200 })
    list(@Param('customerId') customerId: number) {
        return this.service.findForCustomer(Number(customerId));
    }

    @Post()
    @Roles(Role.Employee, Role.Admin)
    @ApiOperation({ summary: 'Create communication' })
    @ApiResponse({ status: 201 })
    create(@Body() dto: CreateCommunicationDto) {
        return this.service.create(dto.customerId, dto.medium, dto.content);
    }
}
