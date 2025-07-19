import { Body, Controller, Post, Req, Headers } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly payments: PaymentsService) {}

    @Post('create-session')
    async create(@Body('appointmentId') appointmentId: number) {
        const url = await this.payments.createCheckoutSession(appointmentId);
        return { url };
    }

    @Post('webhook')
    async webhook(@Req() req: any, @Headers('stripe-signature') sig: string) {
        const buf = req.rawBody as Buffer;
        await this.payments.handleWebhook(buf, sig);
        return {};
    }
}
