import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './customer.entity';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { UsersModule } from '../users/users.module';
import { LogsModule } from '../logs/logs.module';

@Module({
    imports: [TypeOrmModule.forFeature([Customer]), UsersModule, LogsModule],
    controllers: [CustomersController],
    providers: [CustomersService],
    exports: [TypeOrmModule, CustomersService],
})
export class CustomersModule {}
