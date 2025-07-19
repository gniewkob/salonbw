import { Body, Controller, Post, Req, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
    constructor(private readonly payments: PaymentsService) {}

    @Post('create-session')
    @ApiOperation({ summary: 'Create Stripe checkout session' })
    @ApiResponse({ status: 201 })
    async create(@Body('appointmentId') appointmentId: number) {
        const url = await this.payments.createCheckoutSession(appointmentId);
        return { url };
    }

    @Post('webhook')
    @ApiOperation({ summary: 'Stripe webhook endpoint' })
    @ApiResponse({ status: 200 })
    async webhook(@Req() req: any, @Headers('stripe-signature') sig: string) {
        const buf = req.rawBody as Buffer;
        await this.payments.handleWebhook(buf, sig);
        return {};
    }
}
