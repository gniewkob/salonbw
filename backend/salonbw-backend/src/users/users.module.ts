import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Appointment } from '../appointments/appointment.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { EmployeesController } from './employees.controller';
import { RolesGuard } from '../auth/roles.guard';
import { LogsModule } from '../logs/logs.module';

@Module({
    imports: [TypeOrmModule.forFeature([User, Appointment]), LogsModule],
    providers: [UsersService, RolesGuard],
    controllers: [UsersController, EmployeesController],
    exports: [UsersService],
})
export class UsersModule {}
