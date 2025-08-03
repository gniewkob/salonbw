import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { Invoice } from './invoice.entity';
import { Appointment } from '../appointments/appointment.entity';
import { LogsService } from '../logs/logs.service';
import { LogAction } from '../logs/action.enum';

@Injectable()
export class InvoicesService {
    private readonly logger = new Logger(InvoicesService.name);
    constructor(
        @InjectRepository(Invoice)
        private readonly repo: Repository<Invoice>,
        @InjectRepository(Appointment)
        private readonly appts: Repository<Appointment>,
        private readonly logs: LogsService,
    ) {}

    async generate(reservationId: number) {
        const appt = await this.appts.findOne({
            where: { id: reservationId },
            relations: { client: true, service: true },
        });
        if (!appt) throw new BadRequestException('Reservation not found');
        try {
            const res = await axios.post(
                `${process.env.INVOICE_API_URL}/invoices`,
                {
                    client: {
                        name: `${appt.client.firstName} ${appt.client.lastName}`,
                    },
                    items: [
                        {
                            name: appt.service.name,
                            price: appt.service.price,
                        },
                    ],
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.INVOICE_API_TOKEN}`,
                    },
                },
            );
            const invoice = this.repo.create({
                reservationId,
                reservation: appt,
                number: res.data.number,
                pdfUrl: res.data.pdf_url,
                status: 'issued',
            });
            const saved = await this.repo.save(invoice);
            await this.logs.create(
                LogAction.InvoiceGenerated,
                JSON.stringify({ reservationId, number: saved.number }),
            );
            return saved;
        } catch (err) {
            this.logger.error(`Invoice generation failed: ${err}`);
            throw err;
        }
    }

    async findAll() {
        return this.repo.find();
    }

    async getPdf(id: number) {
        const invoice = await this.repo.findOne({ where: { id } });
        if (!invoice) throw new BadRequestException('Invoice not found');
        return { pdfUrl: invoice.pdfUrl };
    }
}
