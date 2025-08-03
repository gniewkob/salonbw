import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { LogsModule } from '../logs/logs.module';

@Module({
    imports: [TypeOrmModule.forFeature([User]), LogsModule],
    controllers: [EmployeesController],
    providers: [EmployeesService],
    exports: [TypeOrmModule, EmployeesService],
})
export class EmployeesModule {}
