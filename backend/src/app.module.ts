import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { MessagesModule } from './messages/messages.module';
import { CatalogModule } from './catalog/catalog.module';
import { FormulasModule } from './formulas/formulas.module';
import { CommissionsModule } from './commissions/commissions.module';
import { ServicesModule } from './services/services.module';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';
import { LogsModule } from './logs/logs.module';
import { CommunicationsModule } from './communications/communications.module';
import { ReviewsModule } from './reviews/reviews.module';

@Module({
    imports: [
        ConfigModule.forRoot({ envFilePath: '.env' }),
        TypeOrmModule.forRootAsync({
            useFactory: () => {
                const url = process.env.DATABASE_URL || 'sqlite::memory:';
                const isSqlite = url.startsWith('sqlite:');
                return {
                    type: isSqlite ? 'sqlite' : 'postgres',
                    ...(isSqlite
                        ? { database: url.replace('sqlite:', '') }
                        : { url }),
                    autoLoadEntities: true,
                    migrations: [__dirname + '/migrations/*.ts'],
                    migrationsRun: !isSqlite,
                    synchronize: isSqlite && process.env.NODE_ENV !== 'production',
                } as any;
            },
        }),
        UsersModule,
        AuthModule,
        AppointmentsModule,
        MessagesModule,
        CatalogModule,
        FormulasModule,
        CommissionsModule,
        ServicesModule,
        ProductsModule,
        SalesModule,
        ReviewsModule,
        LogsModule,
        CommunicationsModule,
    ],
    controllers: [AppController, HealthController],
    providers: [AppService],
})
export class AppModule {}
