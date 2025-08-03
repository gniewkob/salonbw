import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './customer.entity';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [TypeOrmModule.forFeature([Customer]), UsersModule],
    controllers: [CustomersController],
    providers: [CustomersService],
    exports: [TypeOrmModule, CustomersService],
})
export class CustomersModule {}
