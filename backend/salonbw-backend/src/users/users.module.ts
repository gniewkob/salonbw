import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { RolesGuard } from '../auth/roles.guard';

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    providers: [UsersService, RolesGuard],
    controllers: [UsersController],
    exports: [UsersService],
})
export class UsersModule {}
