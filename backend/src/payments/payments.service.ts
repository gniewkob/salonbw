import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, PaymentStatus } from '../appointments/appointment.entity';
import { LogsService } from '../logs/logs.service';
import { LogAction } from '../logs/action.enum';

@Injectable()
export class PaymentsService {
    private readonly stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
        apiVersion: '2024-04-10' as any,
    });
    private readonly logger = new Logger(PaymentsService.name);
    constructor(
        @InjectRepository(Appointment)
        private readonly appts: Repository<Appointment>,
        private readonly logs: LogsService,
    ) {}

    async createCheckoutSession(appointmentId: number) {
        const appt = await this.appts.findOne({ where: { id: appointmentId } });
        if (!appt) throw new Error('Appointment not found');
        if (!appt.service) {
            await this.appts.findOne({ where: { id: appointmentId }, relations: { service: true } });
        }
        const service = appt.service;
        const session = await this.stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'pln',
                        unit_amount: Math.round(Number(service.price) * 100),
                        product_data: { name: service.name },
                    },
                    quantity: 1,
                },
            ],
            metadata: { appointmentId: String(appt.id) },
            success_url: `${process.env.FRONTEND_URL}/success`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`,
        });
        await this.logs.create(
            LogAction.PaymentInit,
            JSON.stringify({ appointmentId: appt.id, sessionId: session.id }),
        );
        return session.url;
    }

    async handleWebhook(payload: Buffer, signature: string) {
        const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
        let event: Stripe.Event;
        try {
            event = this.stripe.webhooks.constructEvent(payload, signature, secret);
        } catch (err) {
            this.logger.error(`Signature verification failed: ${err}`);
            throw err;
        }
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            const apptId = Number(session.metadata?.appointmentId);
            const appt = await this.appts.findOne({ where: { id: apptId } });
            if (!appt || appt.paymentStatus === PaymentStatus.Paid) return;
            appt.paymentStatus = PaymentStatus.Paid;
            await this.appts.save(appt);
            await this.logs.create(
                LogAction.PaymentPaid,
                JSON.stringify({ appointmentId: appt.id, sessionId: session.id }),
            );
        } else if (event.type === 'payment_intent.payment_failed') {
            const intent = event.data.object as Stripe.PaymentIntent;
            const apptId = Number(intent.metadata?.appointmentId);
            const appt = await this.appts.findOne({ where: { id: apptId } });
            if (!appt) return;
            appt.paymentStatus = PaymentStatus.Failed;
            await this.appts.save(appt);
        } else if (event.type === 'charge.refunded') {
            const charge = event.data.object as Stripe.Charge;
            const apptId = Number(charge.metadata?.appointmentId);
            const appt = await this.appts.findOne({ where: { id: apptId } });
            if (!appt) return;
            appt.paymentStatus = PaymentStatus.Refunded;
            await this.appts.save(appt);
        }
    }
}
