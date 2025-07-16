import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Log } from './log.entity';
import { LogsService } from './logs.service';
import { LogsController } from './logs.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Log])],
    providers: [LogsService],
    controllers: [LogsController],
    exports: [LogsService, TypeOrmModule],
})
export class LogsModule {}
