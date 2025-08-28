import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ServicesModule } from './services/services.module';
import { ProductsModule } from './products/products.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { FormulasModule } from './formulas/formulas.module';
import { CommissionsModule } from './commissions/commissions.module';
import { LogsModule } from './logs/logs.module';
import { ChatModule } from './chat/chat.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ScheduleModule.forRoot(),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'postgres',
                url: config.get<string>('DATABASE_URL'),
                autoLoadEntities: true,
                // NOTE: synchronize is convenient for development but
                // should be disabled in production where migrations are used.
                synchronize: config.get<string>('NODE_ENV') !== 'production',
                migrations: [__dirname + '/migrations/*{.ts,.js}'],
            }),
        }),
        UsersModule,
        AuthModule,
        ServicesModule,
        ProductsModule,
        AppointmentsModule,
        FormulasModule,
        CommissionsModule,
        LogsModule,
        ChatModule,
        NotificationsModule,
        DashboardModule,
    ],
    controllers: [AppController, HealthController],
    providers: [AppService],
})
export class AppModule {}
