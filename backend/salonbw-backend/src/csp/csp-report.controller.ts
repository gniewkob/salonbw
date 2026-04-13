import { Controller, Post, Body, HttpCode, Logger } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

interface CSPViolationReport {
    'csp-report': {
        'document-uri'?: string;
        'violated-directive'?: string;
        'effective-directive'?: string;
        'original-policy'?: string;
        'blocked-uri'?: string;
        'source-file'?: string;
        'line-number'?: number;
        'column-number'?: number;
        'status-code'?: number;
    };
}

@Controller('csp-report')
export class CSPReportController {
    private readonly logger = new Logger(CSPReportController.name);

    @SkipThrottle() // CSP reports can be frequent, don't throttle
    @Post()
    @HttpCode(204)
    receiveReport(@Body() report: CSPViolationReport): void {
        const violation = report['csp-report'];

        // Log CSP violations for monitoring
        this.logger.warn('CSP Violation Detected', {
            documentUri: violation['document-uri'],
            violatedDirective: violation['violated-directive'],
            effectiveDirective: violation['effective-directive'],
            blockedUri: violation['blocked-uri'],
            sourceFile: violation['source-file'],
            lineNumber: violation['line-number'],
            columnNumber: violation['column-number'],
        });

        // In production, you might want to:
        // 1. Store violations in a database for analysis
        // 2. Alert on certain violation patterns
        // 3. Track violation rates via metrics
    }
}
