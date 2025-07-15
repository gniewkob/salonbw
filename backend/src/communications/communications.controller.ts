import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { CommunicationsService } from './communications.service';
import { CreateCommunicationDto } from './dto/create-communication.dto';

@Controller('communications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommunicationsController {
    constructor(private readonly service: CommunicationsService) {}

    @Get(':customerId')
    @Roles(Role.Employee, Role.Admin)
    list(@Param('customerId') customerId: number) {
        return this.service.findForCustomer(Number(customerId));
    }

    @Post()
    @Roles(Role.Employee, Role.Admin)
    create(@Body() dto: CreateCommunicationDto) {
        return this.service.create(dto.customerId, dto.medium, dto.content);
    }
}
