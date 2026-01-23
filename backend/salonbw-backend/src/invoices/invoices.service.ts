import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from './invoice.entity';
import { User } from '../users/user.entity';

@Injectable()
export class InvoicesService {
    constructor(
        @InjectRepository(Invoice)
        private readonly invoiceRepository: Repository<Invoice>,
    ) {}

    async findAll(): Promise<Invoice[]> {
        return this.invoiceRepository.find({
            order: { createdAt: 'DESC' },
        });
    }

    async findForClient(clientId: number): Promise<Invoice[]> {
        return this.invoiceRepository.find({
            where: { client: { id: clientId } },
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: number): Promise<Invoice | null> {
        return this.invoiceRepository.findOne({ where: { id } });
    }

    async create(data: {
        client: User;
        amount: number;
        notes?: string;
    }): Promise<Invoice> {
        const invoice = this.invoiceRepository.create({
            ...data,
            number: this.generateInvoiceNumber(),
            status: InvoiceStatus.Draft,
        });
        return this.invoiceRepository.save(invoice);
    }

    async markAsPaid(id: number): Promise<Invoice | null> {
        await this.invoiceRepository.update(id, {
            status: InvoiceStatus.Paid,
            paidAt: new Date(),
        });
        return this.findOne(id);
    }

    async cancel(id: number): Promise<Invoice | null> {
        await this.invoiceRepository.update(id, {
            status: InvoiceStatus.Cancelled,
        });
        return this.findOne(id);
    }

    private generateInvoiceNumber(): string {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `INV-${year}${month}-${random}`;
    }
}
