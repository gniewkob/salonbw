import {
    Controller,
    Get,
    Param,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import { FormulasService } from './formulas.service';
import { Formula } from './formula.entity';

@ApiTags('formulas')
@Controller('clients')
export class ClientFormulasController {
    constructor(private readonly formulasService: FormulasService) {}

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Admin)
    @Get('me/formulas')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get formulas for current user' })
    @ApiResponse({ status: 200, type: Formula, isArray: true })
    findMine(@CurrentUser() user: { userId: number }): Promise<Formula[]> {
        return this.formulasService.findForClient(user.userId);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Employee, Role.Admin)
    @Get(':id/formulas')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get formulas for client' })
    @ApiResponse({ status: 200, type: Formula, isArray: true })
    findForClient(@Param('id', ParseIntPipe) id: number): Promise<Formula[]> {
        return this.formulasService.findForClient(id);
    }
}
