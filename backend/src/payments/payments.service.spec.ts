import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { Appointment, PaymentStatus } from '../appointments/appointment.entity';
import { LogsService } from '../logs/logs.service';
import Stripe from 'stripe';

jest.mock('stripe');

const StripeMock = Stripe as jest.MockedClass<typeof Stripe>;

describe('PaymentsService', () => {
    let service: PaymentsService;
    const repo = {
        findOne: jest.fn(),
        save: jest.fn(),
    } as any;
    const logs = { create: jest.fn() } as any;

    beforeEach(async () => {
        StripeMock.mockClear();
        repo.findOne.mockReset();
        repo.save.mockReset();
        logs.create.mockReset();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentsService,
                { provide: getRepositoryToken(Appointment), useValue: repo },
                { provide: LogsService, useValue: logs },
            ],
        }).compile();
        service = module.get(PaymentsService);
        (service as any).stripe.checkout = { sessions: { create: jest.fn() } } as any;
        (service as any).stripe.webhooks = { constructEvent: jest.fn() } as any;
    });

    it('creates checkout session', async () => {
        repo.findOne.mockResolvedValue({ id: 1, service: { name: 'cut', price: 10 } });
        (service as any).stripe.checkout.sessions.create.mockResolvedValue({ id: 's', url: 'u' });
        const url = await service.createCheckoutSession(1);
        expect(url).toBe('u');
        expect(logs.create).toHaveBeenCalled();
    });

    it('updates appointment on successful webhook', async () => {
        const appt = { id: 1, paymentStatus: PaymentStatus.Pending };
        repo.findOne.mockResolvedValue(appt);
        (service as any).stripe.webhooks.constructEvent.mockReturnValue({
            type: 'checkout.session.completed',
            data: { object: { id: 's', metadata: { appointmentId: '1' } } },
        });
        await service.handleWebhook(Buffer.from(''), 'sig');
        expect(appt.paymentStatus).toBe(PaymentStatus.Paid);
        expect(repo.save).toHaveBeenCalledWith(appt);
    });

    it('ignores duplicate webhook', async () => {
        const appt = { id: 1, paymentStatus: PaymentStatus.Paid };
        repo.findOne.mockResolvedValue(appt);
        (service as any).stripe.webhooks.constructEvent.mockReturnValue({
            type: 'checkout.session.completed',
            data: { object: { id: 's', metadata: { appointmentId: '1' } } },
        });
        await service.handleWebhook(Buffer.from(''), 'sig');
        expect(repo.save).not.toHaveBeenCalled();
    });
});
