import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service as ServiceEntity } from '../catalog/service.entity';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';

@Module({
    imports: [TypeOrmModule.forFeature([ServiceEntity])],
    controllers: [ServicesController],
    providers: [ServicesService],
})
export class ServicesModule {}
