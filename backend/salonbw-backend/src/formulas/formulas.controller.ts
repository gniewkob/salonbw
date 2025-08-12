import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import { FormulasService } from './formulas.service';
import { Formula } from './formula.entity';

@Controller('formulas')
export class FormulasController {
    constructor(private readonly formulasService: FormulasService) {}

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Employee, Role.Admin)
    @Post('appointments/:id')
    addFormula(
        @Param('id') id: string,
        @Body() body: { description: string; date: string },
        @CurrentUser() user: { userId: number },
    ): Promise<Formula> {
        return this.formulasService.addToAppointment(Number(id), user.userId, {
            description: body.description,
            date: new Date(body.date),
        });
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Admin)
    @Get('me')
    findMine(@CurrentUser() user: { userId: number }): Promise<Formula[]> {
        return this.formulasService.findForClient(user.userId);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Employee, Role.Admin)
    @Get('clients/:id')
    findForClient(@Param('id') id: string): Promise<Formula[]> {
        return this.formulasService.findForClient(Number(id));
    }
}
