import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import { FormulasService } from './formulas.service';
import { Formula } from './formula.entity';

@Controller('clients')
export class ClientFormulasController {
    constructor(private readonly formulasService: FormulasService) {}

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Admin)
    @Get('me/formulas')
    findMine(@CurrentUser() user: { userId: number }): Promise<Formula[]> {
        return this.formulasService.findForClient(user.userId);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Employee, Role.Admin)
    @Get(':id/formulas')
    findForClient(@Param('id') id: string): Promise<Formula[]> {
        return this.formulasService.findForClient(Number(id));
    }
}
