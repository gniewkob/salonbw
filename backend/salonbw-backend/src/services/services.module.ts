import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../auth/roles.guard';
import { Service } from './service.entity';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Service])],
    providers: [ServicesService, RolesGuard],
    controllers: [ServicesController],
})
export class ServicesModule {}
