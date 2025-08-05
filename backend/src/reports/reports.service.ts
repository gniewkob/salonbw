import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportsService {
    getFinancial(from?: string, to?: string) {
        return { from, to };
    }

    getEmployeeReport(id: number, from?: string, to?: string) {
        return { id, from, to };
    }

    getTopServices(limit: number) {
        return { limit };
    }

    getTopProducts(limit: number) {
        return { limit };
    }

    getNewCustomers(from?: string, to?: string) {
        return { from, to };
    }

    export(type: string) {
        return { type };
    }
}
