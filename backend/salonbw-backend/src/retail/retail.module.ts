import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesController } from './sales.controller';
import { InventoryController } from './inventory.controller';
import { RetailService } from './retail.service';
import { Product } from '../products/product.entity';
import { Appointment } from '../appointments/appointment.entity';
import { User } from '../users/user.entity';
import { CommissionsModule } from '../commissions/commissions.module';
import { LogsModule } from '../logs/logs.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Product, Appointment, User]),
        CommissionsModule,
        LogsModule,
    ],
    controllers: [SalesController, InventoryController],
    providers: [RetailService],
})
export class RetailModule {}
