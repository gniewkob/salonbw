import { Module, Global } from '@nestjs/common';
import { PricingService } from './pricing.service';

@Global()
@Module({
    providers: [PricingService],
    exports: [PricingService],
})
export class FinanceModule {}
