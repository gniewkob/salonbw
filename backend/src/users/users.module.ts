import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Employee } from '../employees/employee.entity';
import { Customer } from '../customers/customer.entity';
import { Appointment } from '../appointments/appointment.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Employee, Customer, Appointment]),
    ],
    providers: [UsersService],
    controllers: [UsersController],
    exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
