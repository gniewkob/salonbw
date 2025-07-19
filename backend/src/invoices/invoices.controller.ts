import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class InvoicesController {
    constructor(private readonly service: InvoicesService) {}

    @Get()
    list() {
        return this.service.findAll();
    }

    @Post('generate/:reservationId')
    generate(@Param('reservationId') id: number) {
        return this.service.generate(Number(id));
    }

    @Get(':id/pdf')
    getPdf(@Param('id') id: number) {
        return this.service.getPdf(Number(id));
    }
}
