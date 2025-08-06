import {
    Controller,
    Get,
    Param,
    Request,
    ForbiddenException,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { FormulasService } from './formulas.service';

@ApiTags('Formulas')
@ApiBearerAuth()
@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsFormulasController {
    constructor(private readonly service: FormulasService) {}

    @Get(':id/formulas')
    @Roles(Role.Client, Role.Employee)
    @ApiOperation({ summary: 'List formulas for client' })
    @ApiResponse({ status: 200 })
    async list(@Param('id') id: number, @Request() req) {
        if (req.user.role === Role.Client && req.user.id !== Number(id)) {
            throw new ForbiddenException();
        }
        return this.service.findForUser(Number(id));
    }
}
