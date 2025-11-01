import { Module } from '@nestjs/common';
import { CSPReportController } from './csp-report.controller';

@Module({
    controllers: [CSPReportController],
})
export class CSPModule {}
