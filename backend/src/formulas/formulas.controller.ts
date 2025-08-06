import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { FormulasService } from './formulas.service';
import { CreateFormulaDto } from './dto/create-formula.dto';

@ApiTags('Formulas')
@ApiBearerAuth()
@Controller('formulas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FormulasController {
    constructor(private readonly service: FormulasService) {}

    @Get()
    @Roles(Role.Client, Role.Employee)
    @ApiOperation({ summary: 'List formulas for current user' })
    @ApiResponse({ status: 200 })
    listOwn(@Request() req) {
        return this.service.findForUser(Number(req.user.id));
    }

    @Get(':clientId')
    @Roles(Role.Employee)
    @ApiOperation({ summary: 'List formulas for client' })
    @ApiResponse({ status: 200 })
    listForClient(@Param('clientId') clientId: string) {
        return this.service.findForUser(Number(clientId));
    }

    @Post()
    @Roles(Role.Employee)
    @ApiOperation({ summary: 'Create formula' })
    @ApiResponse({ status: 201 })
    create(@Body() dto: CreateFormulaDto) {
        return this.service.create(
            dto.clientId,
            dto.description,
            dto.appointmentId,
        );
    }
}
