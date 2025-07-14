import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Formula } from './formula.entity';
import { FormulasService } from './formulas.service';
import { FormulasController } from './formulas.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Formula])],
    controllers: [FormulasController],
    providers: [FormulasService],
    exports: [TypeOrmModule, FormulasService],
})
export class FormulasModule {}
