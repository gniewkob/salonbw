import 'dotenv/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            url: process.env.DATABASE_URL,
            autoLoadEntities: true,
            // NOTE: synchronize is convenient for development but
            // should be disabled in production where migrations are used.
            synchronize: process.env.NODE_ENV !== 'production',
            migrations: [__dirname + '/migrations/*{.ts,.js}'],
        }),
        UsersModule,
        AuthModule,
    ],
    controllers: [AppController, HealthController],
    providers: [AppService],
})
export class AppModule {}
