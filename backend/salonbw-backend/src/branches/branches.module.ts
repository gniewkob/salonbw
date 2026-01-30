import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branch, BranchMember } from './entities/branch.entity';
import { BranchesService } from './branches.service';
import { BranchesController } from './branches.controller';
import { LogsModule } from '../logs/logs.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Branch, BranchMember]),
        LogsModule,
    ],
    providers: [BranchesService],
    controllers: [BranchesController],
    exports: [BranchesService],
})
export class BranchesModule {}
