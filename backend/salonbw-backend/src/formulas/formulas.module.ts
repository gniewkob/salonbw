import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Formula } from './formula.entity';
import { FormulasService } from './formulas.service';
import { AppointmentFormulasController } from './appointment-formulas.controller';
import { CustomerFormulasController } from './customer-formulas.controller';
import { Appointment } from '../appointments/appointment.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Formula, Appointment])],
    providers: [FormulasService],
    controllers: [AppointmentFormulasController, CustomerFormulasController],
})
export class FormulasModule {}
