import {
    Body,
    Controller,
    Get,
    Headers,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
    ApiBearerAuth,
    ApiHeader,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import {
    CommunicationConsentsService,
    ConsentActor,
} from './communication-consents.service';
import {
    ConsentHistoryQueryDto,
    GrantConsentDto,
    UpdatePreferencesDto,
    WithdrawConsentDto,
    WithdrawDirectMarketingDto,
} from './dto/consent.dto';

type JwtUser = { userId: number; role: Role };

const actorOf = (user: JwtUser): ConsentActor => ({
    id: user.userId,
    role: user.role,
});

const IDEMPOTENCY = {
    name: 'Idempotency-Key',
    required: false,
    description:
        'Client-generated key; a replay with the same body returns current state without new audit events',
};

@ApiTags('communication-consents')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller()
export class CommunicationConsentsController {
    constructor(private readonly service: CommunicationConsentsService) {}

    @Get('communication-consents/catalog')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist, Role.Client)
    @ApiOperation({
        summary:
            'Communication types, channels, capability matrix and consent statements',
    })
    catalog() {
        return this.service.catalog();
    }

    // ------------------------------------------------------------ staff

    @Get('customers/:id/communication-preferences')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({
        summary: 'Customer consents, preferences, effective state',
    })
    getForCustomer(@Param('id', ParseIntPipe) id: number) {
        return this.service.getState(id, 'staff');
    }

    @Put('customers/:id/communication-preferences')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiHeader(IDEMPOTENCY)
    updateForCustomer(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdatePreferencesDto,
        @CurrentUser() user: JwtUser,
        @Headers('idempotency-key') key?: string,
    ) {
        return this.service.updatePreferences(
            id,
            dto.changes,
            actorOf(user),
            'staff',
            key,
        );
    }

    @Get('customers/:id/consent-history')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Audited consent & preference history' })
    historyForCustomer(
        @Param('id', ParseIntPipe) id: number,
        @Query() query: ConsentHistoryQueryDto,
    ) {
        return this.service.getHistory(
            id,
            'staff',
            query.page ?? 1,
            query.limit ?? 25,
        );
    }

    @Post('customers/:id/consents/grant')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiHeader(IDEMPOTENCY)
    @ApiOperation({
        summary: 'Record a consent the customer gave, with evidence',
    })
    grantForCustomer(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: GrantConsentDto,
        @CurrentUser() user: JwtUser,
        @Headers('idempotency-key') key?: string,
    ) {
        return this.service.grantConsent(id, dto, actorOf(user), 'staff', key);
    }

    @Post('customers/:id/consents/withdraw')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiHeader(IDEMPOTENCY)
    @ApiOperation({ summary: 'Record a withdrawal requested by the customer' })
    withdrawForCustomer(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: WithdrawConsentDto,
        @CurrentUser() user: JwtUser,
        @Headers('idempotency-key') key?: string,
    ) {
        return this.service.withdrawConsent(
            id,
            dto,
            actorOf(user),
            'staff',
            key,
        );
    }

    @Post('customers/:id/consents/withdraw-direct-marketing')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiHeader(IDEMPOTENCY)
    @ApiOperation({
        summary: 'Atomically withdraw selected direct-marketing channels',
    })
    withdrawDirectMarketingForCustomer(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: WithdrawDirectMarketingDto,
        @CurrentUser() user: JwtUser,
        @Headers('idempotency-key') key?: string,
    ) {
        return this.service.withdrawDirectMarketing(
            id,
            dto,
            actorOf(user),
            'staff',
            key,
        );
    }

    // ------------------------------------------------------ self-service
    // Customer identity comes only from the JWT; there is no :id parameter.

    @Get('users/profile/communication-preferences')
    @Roles(Role.Client)
    getOwn(@CurrentUser() user: JwtUser) {
        return this.service.getState(user.userId, 'customer');
    }

    @Put('users/profile/communication-preferences')
    @Roles(Role.Client)
    @ApiHeader(IDEMPOTENCY)
    updateOwn(
        @Body() dto: UpdatePreferencesDto,
        @CurrentUser() user: JwtUser,
        @Headers('idempotency-key') key?: string,
    ) {
        return this.service.updatePreferences(
            user.userId,
            dto.changes,
            actorOf(user),
            'self',
            key,
        );
    }

    @Get('users/profile/consent-history')
    @Roles(Role.Client)
    historyOwn(
        @CurrentUser() user: JwtUser,
        @Query() query: ConsentHistoryQueryDto,
    ) {
        return this.service.getHistory(
            user.userId,
            'customer',
            query.page ?? 1,
            query.limit ?? 25,
        );
    }

    @Post('users/profile/consents/grant')
    @Roles(Role.Client)
    @ApiHeader(IDEMPOTENCY)
    grantOwn(
        @Body() dto: GrantConsentDto,
        @CurrentUser() user: JwtUser,
        @Headers('idempotency-key') key?: string,
    ) {
        return this.service.grantConsent(
            user.userId,
            dto,
            actorOf(user),
            'self',
            key,
        );
    }

    @Post('users/profile/consents/withdraw-direct-marketing')
    @Roles(Role.Client)
    @ApiHeader(IDEMPOTENCY)
    @ApiOperation({
        summary: 'Atomically withdraw own direct-marketing channels',
    })
    withdrawOwnDirectMarketing(
        @Body() dto: WithdrawDirectMarketingDto,
        @CurrentUser() user: JwtUser,
        @Headers('idempotency-key') key?: string,
    ) {
        return this.service.withdrawDirectMarketing(
            user.userId,
            dto,
            actorOf(user),
            'self',
            key,
        );
    }

    @Post('users/profile/consents/withdraw')
    @Roles(Role.Client)
    @ApiHeader(IDEMPOTENCY)
    withdrawOwn(
        @Body() dto: WithdrawConsentDto,
        @CurrentUser() user: JwtUser,
        @Headers('idempotency-key') key?: string,
    ) {
        return this.service.withdrawConsent(
            user.userId,
            dto,
            actorOf(user),
            'self',
            key,
        );
    }
}
