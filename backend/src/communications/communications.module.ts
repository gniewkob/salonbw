import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Communication } from './communication.entity';
import { CommunicationsService } from './communications.service';
import { CommunicationsController } from './communications.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Communication])],
    controllers: [CommunicationsController],
    providers: [CommunicationsService],
    exports: [TypeOrmModule, CommunicationsService],
})
export class CommunicationsModule {}
