import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Formula } from './formula.entity';
import { FormulasService } from './formulas.service';
import { FormulasController } from './formulas.controller';
import { Appointment } from '../appointments/appointment.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Formula, Appointment])],
    providers: [FormulasService],
    controllers: [FormulasController],
})
export class FormulasModule {}

