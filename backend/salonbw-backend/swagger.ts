import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'node:fs';
import { Module } from '@nestjs/common';
import { AppController } from './src/app.controller';
import { AppService } from './src/app.service';
import { HealthController } from './src/health.controller';
import { HealthService } from './src/health.service';
import { UsersController } from './src/users/users.controller';
import { UsersService } from './src/users/users.service';
import { AuthController } from './src/auth/auth.controller';
import { AuthService } from './src/auth/auth.service';
import { AppointmentsController } from './src/appointments/appointments.controller';
import { AppointmentsService } from './src/appointments/appointments.service';
import { ServicesController } from './src/services/services.controller';
import { ServicesService } from './src/services/services.service';
import { ProductsController } from './src/products/products.controller';
import { ProductsService } from './src/products/products.service';
import { AppointmentFormulasController } from './src/formulas/appointment-formulas.controller';
import { CustomerFormulasController } from './src/formulas/customer-formulas.controller';
import { FormulasService } from './src/formulas/formulas.service';
import { CommissionsController } from './src/commissions/commissions.controller';
import { CommissionsService } from './src/commissions/commissions.service';
import { LogService } from './src/logs/log.service';
import { DashboardController } from './src/dashboard/dashboard.controller';
import { DashboardService } from './src/dashboard/dashboard.service';
import { SalesController } from './src/retail/sales.controller';
import { InventoryController } from './src/retail/inventory.controller';
import { RetailService } from './src/retail/retail.service';
import { UsageController } from './src/retail/usage.controller';
import { ProductCategoriesController } from './src/products/product-categories.controller';
import { ProductCategoriesService } from './src/products/product-categories.service';
import { StocktakingController } from './src/warehouse/stocktaking.controller';
import { StocktakingService } from './src/warehouse/stocktaking.service';
import { OrdersController } from './src/warehouse/orders.controller';
import { OrdersService } from './src/warehouse/orders.service';
import { DeliveriesController } from './src/warehouse/deliveries.controller';
import { DeliveriesService } from './src/warehouse/deliveries.service';
import { SuppliersController } from './src/warehouse/suppliers.controller';
import { SuppliersService } from './src/warehouse/suppliers.service';
import { StockAlertsController } from './src/warehouse/stock-alerts.controller';
import { StockAlertsService } from './src/warehouse/stock-alerts.service';

@Module({
    controllers: [
        AppController,
        HealthController,
        UsersController,
        AuthController,
        AppointmentsController,
        ServicesController,
        ProductsController,
        ProductCategoriesController,
        AppointmentFormulasController,
        CustomerFormulasController,
        CommissionsController,
        DashboardController,
        SalesController,
        UsageController,
        InventoryController,
        StocktakingController,
        OrdersController,
        DeliveriesController,
        SuppliersController,
        StockAlertsController,
    ],
    providers: [
        AppService,
        {
            provide: HealthService,
            useValue: {
                getHealthSummary: async () => ({ status: 'ok' }),
            },
        },
        {
            provide: UsersService,
            useValue: {
                findByEmail: async () => null,
                findById: async () => ({ id: 0, role: 'Client' }),
                createUser: async () => ({ id: 0, role: 'Client' }),
            },
        },
        {
            provide: AuthService,
            useValue: {
                login: () => ({}),
                refresh: () => ({}),
            },
        },
        {
            provide: AppointmentsService,
            useValue: {
                create: () => ({}),
                findForUser: () => [],
                findOne: () => ({}),
                cancel: () => ({}),
                completeAppointment: () => ({}),
            },
        },
        {
            provide: ServicesService,
            useValue: {
                create: () => ({}),
                findAll: () => [],
                findOne: () => ({}),
                update: () => ({}),
                remove: () => undefined,
            },
        },
        {
            provide: ProductsService,
            useValue: {
                create: () => ({}),
                findAll: () => [],
                findOne: () => ({}),
                getCard: () => ({}),
                getHistory: () => [],
                getFormulas: () => [],
                getCommissions: () => [],
                updateCommissions: () => [],
                update: () => ({}),
                remove: () => undefined,
            },
        },
        {
            provide: ProductCategoriesService,
            useValue: {
                findAll: () => [],
                findTree: () => [],
                findOne: () => ({}),
                create: () => ({}),
                update: () => ({}),
                remove: () => undefined,
            },
        },
        {
            provide: FormulasService,
            useValue: {
                addToAppointment: () => ({}),
                findForClient: () => [],
            },
        },
        {
            provide: CommissionsService,
            useValue: {
                findForUser: () => [],
                findAll: () => [],
            },
        },
        {
            provide: LogService,
            useValue: {
                logAction: () => undefined,
                findAll: () => ({ data: [], total: 0, page: 1, limit: 0 }),
            },
        },
        {
            provide: DashboardService,
            useValue: {
                getSummary: () => ({
                    clientCount: 0,
                    employeeCount: 0,
                    todayAppointments: 0,
                    upcomingAppointments: [],
                }),
            },
        },
        {
            provide: RetailService,
            useValue: {
                createSale: () => ({ status: 'ok' }),
                listSales: () => [],
                getSaleDetails: () => ({}),
                createUsage: () => ({ status: 'ok' }),
                listUsage: () => [],
                getUsageDetails: () => ({}),
                getSalesSummary: () => ({
                    source: 'none',
                    from: new Date(),
                    to: new Date(),
                    units: 0,
                    revenue: null,
                }),
                adjustInventory: () => ({ status: 'ok' }),
                getInventoryLevels: () => [],
            },
        },
        {
            provide: StocktakingService,
            useValue: {
                findAll: () => [],
                findHistorySummary: () => [],
                findOne: () => ({}),
                create: () => ({}),
                update: () => ({}),
                start: () => ({}),
                addItems: () => ({}),
                updateItem: () => ({}),
                complete: () => ({}),
            },
        },
        {
            provide: OrdersService,
            useValue: {
                findAll: () => [],
                findOne: () => ({}),
                create: () => ({}),
                update: () => ({}),
                send: () => ({}),
                cancel: () => ({}),
                receive: () => ({}),
            },
        },
        {
            provide: DeliveriesService,
            useValue: {
                findAll: () => [],
                findOne: () => ({}),
                create: () => ({}),
                update: () => ({}),
                addItem: () => ({}),
                updateItem: () => ({}),
                removeItem: () => ({}),
                receive: () => ({}),
                cancel: () => ({}),
            },
        },
        {
            provide: SuppliersService,
            useValue: {
                findAll: () => [],
                findOne: () => ({}),
                create: () => ({}),
                update: () => ({}),
                remove: () => ({}),
            },
        },
        {
            provide: StockAlertsService,
            useValue: {
                getStockAlerts: () => ({}),
                getLowStockProducts: () => [],
                getCriticalStockProducts: () => [],
                getStockSummary: () => ({}),
                getReorderSuggestionsBySupplierId: () => [],
            },
        },
    ],
})
class SwaggerAppModule {}

async function generate() {
    const app = await NestFactory.create(SwaggerAppModule, {
        logger: ['error'],
    });
    try {
        const config = new DocumentBuilder()
            .setTitle('SalonBW API')
            .setDescription('The SalonBW API description')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = SwaggerModule.createDocument(app, config);
        writeFileSync('openapi.json', JSON.stringify(document, null, 2) + '\n');
    } finally {
        await app.close();
    }
}

void generate().catch((error) => {
    console.error('Failed to generate OpenAPI schema', error);
    process.exit(1);
});
