import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
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
import { ProductUsageModule } from './product-usage/product-usage.module';
import { LogsModule } from './logs/logs.module';
import { CommunicationsModule } from './communications/communications.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ChatModule } from './chat/chat.module';
import { ChatMessagesModule } from './chat-messages/chat-messages.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EmailsModule } from './emails/emails.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PaymentsModule } from './payments/payments.module';
import { CalendarModule } from './calendar/calendar.module';
import { InvoicesModule } from './invoices/invoices.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { CustomersModule } from './customers/customers.module';
import { EmployeesModule } from './employees/employees.module';
import { CategoriesModule } from './categories/categories.module';
import { ReportsModule } from './reports/reports.module';

@Module({
    imports: [
        ConfigModule.forRoot({ envFilePath: '.env' }),
        ScheduleModule.forRoot(),
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
                    synchronize:
                        isSqlite && process.env.NODE_ENV !== 'production',
                } as any;
            },
        }),
        UsersModule,
        AuthModule,
        AppointmentsModule,
        MessagesModule,
        CatalogModule,
        CategoriesModule,
        FormulasModule,
        CommissionsModule,
        ServicesModule,
        ProductsModule,
        ProductUsageModule,
        SalesModule,
        ReviewsModule,
        ChatMessagesModule,
        ChatModule,
        LogsModule,
        CommunicationsModule,
        DashboardModule,
        EmployeesModule,
        CustomersModule,
        NotificationsModule,
        PaymentsModule,
        CalendarModule,
        InvoicesModule,
        IntegrationsModule,
        EmailsModule,
        ReportsModule,
    ],
    controllers: [AppController, HealthController],
    providers: [AppService],
})
export class AppModule {}
