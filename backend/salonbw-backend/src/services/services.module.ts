import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../auth/roles.guard';
import { LogsModule } from '../logs/logs.module';

// Entities
import { Service } from './service.entity';
import { ServiceCategory } from './entities/service-category.entity';
import { ServiceVariant } from './entities/service-variant.entity';
import { EmployeeService } from './entities/employee-service.entity';
import { ServiceMedia } from './entities/service-media.entity';
import { ServiceReview } from './entities/service-review.entity';
import { ServiceRecipeItem } from './entities/service-recipe-item.entity';
import { User } from '../users/user.entity';
import { Product } from '../products/product.entity';
import { Appointment } from '../appointments/appointment.entity';
import { CommissionRule } from '../commissions/commission-rule.entity';

// Services
import { ServicesService } from './services.service';
import { ServiceCategoriesService } from './service-categories.service';
import { ServiceVariantsService } from './service-variants.service';
import { EmployeeServicesService } from './employee-services.service';
import { ServiceDetailsService } from './service-details.service';

// Controllers
import { ServicesController } from './services.controller';
import { ServiceCategoriesController } from './service-categories.controller';
import { ServiceVariantsController } from './service-variants.controller';
import { EmployeeServicesController } from './employee-services.controller';
import { ServiceDetailsController } from './service-details.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Service,
            ServiceCategory,
            ServiceVariant,
            EmployeeService,
            ServiceMedia,
            ServiceReview,
            ServiceRecipeItem,
            User,
            Product,
            Appointment,
            CommissionRule,
        ]),
        LogsModule,
    ],
    providers: [
        ServicesService,
        ServiceCategoriesService,
        ServiceVariantsService,
        EmployeeServicesService,
        ServiceDetailsService,
        RolesGuard,
    ],
    controllers: [
        ServicesController,
        ServiceCategoriesController,
        ServiceVariantsController,
        EmployeeServicesController,
        ServiceDetailsController,
    ],
    exports: [
        ServicesService,
        ServiceCategoriesService,
        ServiceVariantsService,
        EmployeeServicesService,
        ServiceDetailsService,
    ],
})
export class ServicesModule {}
