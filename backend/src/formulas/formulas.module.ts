import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Formula } from './formula.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Formula])],
    exports: [TypeOrmModule],
})
export class FormulasModule {}
