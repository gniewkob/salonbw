import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Log } from './log.entity';
import { LogsService } from './logs.service';

@Module({
    imports: [TypeOrmModule.forFeature([Log])],
    providers: [LogsService],
    exports: [LogsService, TypeOrmModule],
})
export class LogsModule {}
