import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Appointment } from '../appointments/appointment.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ClientsController } from './clients.controller';
import { EmployeesController } from './employees.controller';
import { RolesGuard } from '../auth/roles.guard';

@Module({
    imports: [TypeOrmModule.forFeature([User, Appointment])],
    providers: [UsersService, RolesGuard],
    controllers: [UsersController, ClientsController, EmployeesController],
    exports: [UsersService],
})
export class UsersModule {}
