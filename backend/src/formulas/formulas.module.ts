import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Formula } from './formula.entity';
import { FormulasService } from './formulas.service';
import { FormulasController } from './formulas.controller';
import { AppointmentFormulasController } from './appointment-formulas.controller';
import { ClientsFormulasController } from './clients-formulas.controller';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Formula]),
        forwardRef(() => AppointmentsModule),
    ],
    controllers: [
        FormulasController,
        AppointmentFormulasController,
        ClientsFormulasController,
    ],
    providers: [FormulasService],
    exports: [TypeOrmModule, FormulasService],
})
export class FormulasModule {}
