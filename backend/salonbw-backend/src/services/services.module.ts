import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../auth/roles.guard';
import { LogsModule } from '../logs/logs.module';

// Entities
import { Service } from './service.entity';
import { ServiceCategory } from './entities/service-category.entity';
import { ServiceVariant } from './entities/service-variant.entity';
import { EmployeeService } from './entities/employee-service.entity';
import { User } from '../users/user.entity';

// Services
import { ServicesService } from './services.service';
import { ServiceCategoriesService } from './service-categories.service';
import { ServiceVariantsService } from './service-variants.service';
import { EmployeeServicesService } from './employee-services.service';

// Controllers
import { ServicesController } from './services.controller';
import { ServiceCategoriesController } from './service-categories.controller';
import { ServiceVariantsController } from './service-variants.controller';
import { EmployeeServicesController } from './employee-services.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Service,
            ServiceCategory,
            ServiceVariant,
            EmployeeService,
            User,
        ]),
        LogsModule,
    ],
    providers: [
        ServicesService,
        ServiceCategoriesService,
        ServiceVariantsService,
        EmployeeServicesService,
        RolesGuard,
    ],
    controllers: [
        ServicesController,
        ServiceCategoriesController,
        ServiceVariantsController,
        EmployeeServicesController,
    ],
    exports: [
        ServicesService,
        ServiceCategoriesService,
        ServiceVariantsService,
        EmployeeServicesService,
    ],
})
export class ServicesModule {}
