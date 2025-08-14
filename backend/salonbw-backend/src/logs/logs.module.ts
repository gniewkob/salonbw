import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Log } from './log.entity';
import { LogService } from './log.service';
import { LogsController } from './logs.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Log])],
    controllers: [LogsController],
    providers: [LogService],
    exports: [LogService],
})
export class LogsModule {}
