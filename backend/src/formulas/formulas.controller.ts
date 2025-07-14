import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { FormulasService } from './formulas.service';
import { CreateFormulaDto } from './dto/create-formula.dto';

@Controller('formulas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FormulasController {
    constructor(private readonly service: FormulasService) {}

    @Get()
    @Roles(Role.Client, Role.Employee)
    listOwn(@Request() req) {
        return this.service.findForUser(req.user.id);
    }

    @Get(':clientId')
    @Roles(Role.Employee)
    listForClient(@Param('clientId') clientId: number) {
        return this.service.findForUser(Number(clientId));
    }

    @Post()
    @Roles(Role.Employee)
    create(@Body() dto: CreateFormulaDto) {
        return this.service.create(dto.clientId, dto.description, dto.appointmentId);
    }
}
