import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import { FormulasService } from './formulas.service';
import { Formula } from './formula.entity';

@Controller('appointments/:appointmentId/formulas')
export class AppointmentFormulasController {
    constructor(private readonly formulasService: FormulasService) {}

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Employee, Role.Admin)
    @Post()
    addFormula(
        @Param('appointmentId') id: string,
        @Body() body: { description: string; date: string },
        @CurrentUser() user: { userId: number },
    ): Promise<Formula> {
        return this.formulasService.addToAppointment(Number(id), user.userId, {
            description: body.description,
            date: new Date(body.date),
        });
    }
}
