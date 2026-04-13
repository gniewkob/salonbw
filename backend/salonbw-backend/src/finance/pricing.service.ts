import { Injectable } from '@nestjs/common';

@Injectable()
export class PricingService {
    /**
     * Standard rounding for currency (2 decimal places)
     */
    round(value: number): number {
        return Math.round((value + Number.EPSILON) * 100) / 100;
    }

    /**
     * Calculate net from gross
     * @param gross Total amount
     * @param vatRate Percentage (e.g. 23)
     */
    calculateNet(gross: number, vatRate: number = 23): number {
        return this.round(gross / (1 + vatRate / 100));
    }

    /**
     * Calculate gross from net
     * @param net Base amount
     * @param vatRate Percentage (e.g. 23)
     */
    calculateGross(net: number, vatRate: number = 23): number {
        return this.round(net * (1 + vatRate / 100));
    }

    /**
     * Calculate VAT amount from gross
     */
    calculateVatAmount(gross: number, vatRate: number = 23): number {
        const net = this.calculateNet(gross, vatRate);
        return this.round(gross - net);
    }
}
