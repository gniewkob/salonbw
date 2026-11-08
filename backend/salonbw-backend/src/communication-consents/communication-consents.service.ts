import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
    Optional,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { DataSource, EntityManager } from 'typeorm';
import { User } from '../users/user.entity';
import { Role } from '../users/role.enum';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';
import {
    COMMUNICATION_TYPES,
    CONSENT_SCOPES,
    CONSENT_TEXTS,
    CommunicationChannel,
    CommunicationType,
    ConsentEventType,
    ConsentPurpose,
    ConsentSource,
    ConsentStatus,
    LEGACY_MARKETING_COLUMN,
    LEGACY_OPERATIONAL_COLUMN,
    CommunicationClass,
    STAFF_GRANT_SOURCES,
    findConsentScope,
    getTypeDefinition,
    REGISTRATION_DIRECT_MARKETING_TEXT_VERSION,
} from './communication-consent.types';
import {
    LegacyCustomerFlags,
    PreferenceEvaluation,
    evaluatePreference,
} from './consent-evaluation';
import { CustomerConsent } from './entities/customer-consent.entity';
import { CommunicationPreference } from './entities/communication-preference.entity';
import { ConsentEvent } from './entities/consent-event.entity';
import { ConsentRequest } from './entities/consent-request.entity';
import {
    GrantConsentDto,
    InitialCommunicationSetupDto,
    PreferenceChangeDto,
    WithdrawConsentDto,
} from './dto/consent.dto';

/** Authenticated actor resolved from the JWT — never from the request body. */
export interface ConsentActor {
    id: number;
    role: Role;
}

export type ConsentChannelMode =
    'staff' | 'self' | 'legacy-self' | 'legacy-staff';

export interface ConsentScopeView {
    purpose: ConsentPurpose;
    channel: CommunicationChannel;
    label: string;
    status: ConsentStatus;
    legacyUnverifiedConsent: boolean;
    currentTextVersion: string;
    recordedAt: string | null;
    effectiveAt: string | null;
    source: ConsentSource | null;
    consentTextVersion: string | null;
    /** Staff view only. */
    evidenceReference?: string | null;
    actorRole: string | null;
}

export interface CommunicationStateView {
    customerId: number;
    receiveNotifications: boolean;
    contact: { hasPhone: boolean; hasEmail: boolean };
    consents: ConsentScopeView[];
    preferences: PreferenceEvaluation[];
    updatedAt: string;
}

const SELECT_FLAGS: (keyof User)[] = [
    'id',
    'role',
    'phone',
    'email',
    'receiveNotifications',
    'notifyPanel',
    'notifySms',
    'notifyEmail',
    'notifyWhatsapp',
    'smsConsent',
    'emailConsent',
    'whatsappConsent',
];

const STAFF_ROLES = new Set<Role>([
    Role.Admin,
    Role.Employee,
    Role.Receptionist,
]);

@Injectable()
export class CommunicationConsentsService {
    private readonly logger = new Logger(CommunicationConsentsService.name);

    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
        @Optional() private readonly logService?: LogService,
    ) {}

    // ------------------------------------------------------------------ read

    async getState(
        customerId: number,
        audience: 'staff' | 'customer',
        manager: EntityManager = this.dataSource.manager,
    ): Promise<CommunicationStateView> {
        const { customer, consents, preferences } = await this.load(
            manager,
            customerId,
        );
        return this.buildView(customer, consents, preferences, audience);
    }

    /** Raw data for the eligibility service (single round of queries). */
    async loadForEligibility(customerId: number) {
        return this.load(this.dataSource.manager, customerId, false);
    }

    async getHistory(
        customerId: number,
        audience: 'staff' | 'customer',
        page = 1,
        limit = 25,
    ) {
        await this.requireCustomer(this.dataSource.manager, customerId);
        const qb = this.dataSource
            .getRepository(ConsentEvent)
            .createQueryBuilder('e')
            .leftJoin(User, 'actor', 'actor.id = e.actorId')
            .addSelect('actor.name', 'actor_name')
            .where('e.customerId = :customerId', { customerId })
            .orderBy('e.occurredAt', 'DESC')
            .addOrderBy('e.id', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);
        const total = await qb.getCount();
        const { entities, raw } = await qb.getRawAndEntities<{
            actor_name: string | null;
        }>();

        const items = entities.map((e, index) => {
            const base = {
                id: e.id,
                occurredAt: e.occurredAt.toISOString(),
                eventType: e.eventType,
                purpose: e.purpose,
                communicationType: e.communicationType,
                channel: e.channel,
                previousStatus: e.previousStatus,
                newStatus: e.newStatus,
                source: e.source,
                consentTextVersion: e.consentTextVersion,
                actorRole: e.actorRole,
                performedBySelf: e.actorId !== null && e.actorId === customerId,
            };
            if (audience === 'customer') return base;
            return {
                ...base,
                actorId: e.actorId,
                actorName: raw[index]?.actor_name ?? null,
                evidenceReference: e.evidenceReference,
            };
        });

        const legacyItems =
            audience === 'staff' && page === 1
                ? await this.legacyHistory(customerId)
                : [];

        return { items, total, page, limit, legacyItems };
    }

    catalog() {
        return {
            channels: Object.values(CommunicationChannel),
            types: COMMUNICATION_TYPES.map((t) => ({
                type: t.type,
                class: t.class,
                purpose: t.purpose,
                label: t.label,
                supportedChannels: [...t.supportedChannels],
            })),
            consentScopes: CONSENT_SCOPES.map((s) => ({
                purpose: s.purpose,
                channel: s.channel,
                label: s.label,
                textVersion: s.textVersion,
                text: CONSENT_TEXTS[s.textVersion],
                draft: s.textVersion.endsWith('-draft'),
            })),
            staffGrantSources: [...STAFF_GRANT_SOURCES],
        };
    }

    // ------------------------------------------------------------- mutations

    async grantConsent(
        customerId: number,
        dto: GrantConsentDto,
        actor: ConsentActor,
        mode: 'staff' | 'self',
        idempotencyKey?: string,
    ): Promise<CommunicationStateView> {
        this.assertMode(customerId, actor, mode);
        return this.mutate(
            customerId,
            idempotencyKey,
            dto,
            async (manager) => {
                const { source, evidenceReference, effectiveAt } =
                    this.resolveGrantProvenance(customerId, dto, mode);
                await this.applyGrant(manager, customerId, actor, {
                    purpose: dto.purpose,
                    channel: dto.channel,
                    consentTextVersion: dto.consentTextVersion,
                    source,
                    evidenceReference,
                    effectiveAt,
                });
            },
            mode === 'self' ? 'customer' : 'staff',
        );
    }

    async withdrawConsent(
        customerId: number,
        dto: WithdrawConsentDto,
        actor: ConsentActor,
        mode: 'staff' | 'self',
        idempotencyKey?: string,
    ): Promise<CommunicationStateView> {
        this.assertMode(customerId, actor, mode);
        return this.mutate(
            customerId,
            idempotencyKey,
            dto,
            async (manager) => {
                await this.applyWithdraw(
                    manager,
                    customerId,
                    actor,
                    dto.purpose,
                    dto.channel,
                    mode === 'self'
                        ? ConsentSource.SelfServicePanel
                        : ConsentSource.StaffOnCustomerRequest,
                );
            },
            mode === 'self' ? 'customer' : 'staff',
        );
    }

    async updatePreferences(
        customerId: number,
        changes: PreferenceChangeDto[],
        actor: ConsentActor,
        mode: 'staff' | 'self',
        idempotencyKey?: string,
    ): Promise<CommunicationStateView> {
        this.assertMode(customerId, actor, mode);
        return this.mutate(
            customerId,
            idempotencyKey,
            changes,
            async (manager) => {
                await this.applyPreferenceChanges(
                    manager,
                    customerId,
                    actor,
                    changes,
                    mode === 'self'
                        ? ConsentSource.SelfServicePanel
                        : ConsentSource.StaffPreferenceUpdate,
                );
            },
            mode === 'self' ? 'customer' : 'staff',
        );
    }

    /**
     * Initial state for a customer created by staff. Must run inside the same
     * transaction that inserts the customer so a failure leaves nothing.
     */
    async applyInitialSetup(
        manager: EntityManager,
        customerId: number,
        setup: InitialCommunicationSetupDto,
        actor: ConsentActor,
    ): Promise<void> {
        const grants = setup.grants ?? [];
        if (grants.length > 0) {
            if (!setup.source || !STAFF_GRANT_SOURCES.includes(setup.source)) {
                throw new BadRequestException(
                    'Zgoda marketingowa wymaga wskazania źródła z dowodem (np. podpisany formularz).',
                );
            }
            if (!setup.evidenceReference?.trim()) {
                throw new BadRequestException(
                    'Zgoda marketingowa wymaga odniesienia do dowodu (np. numer formularza).',
                );
            }
            for (const grant of grants) {
                this.assertCurrentText(
                    grant.purpose,
                    grant.channel,
                    grant.consentTextVersion,
                );
                await this.applyGrant(manager, customerId, actor, {
                    purpose: grant.purpose,
                    channel: grant.channel,
                    consentTextVersion: grant.consentTextVersion,
                    source: setup.source,
                    evidenceReference: setup.evidenceReference.trim(),
                    effectiveAt: new Date(),
                });
            }
        }
        if (setup.preferences?.length) {
            await this.applyPreferenceChanges(
                manager,
                customerId,
                actor,
                setup.preferences,
                ConsentSource.StaffPreferenceUpdate,
            );
        }
    }

    /**
     * Compatibility path for legacy boolean forms (PATCH /users/profile/consent,
     * PUT /customers/:id, registration). Translates boolean changes into
     * audited events in one transaction:
     *  - marketing true  by the customer themself → GRANTED (current text)
     *  - marketing true  by staff without evidence → rejected (400)
     *  - marketing false → WITHDRAWN
     *  - notify<Channel> → bulk preference for all operational types
     */
    async applyLegacyFlags(
        manager: EntityManager,
        customerId: number,
        flags: Partial<
            Pick<
                LegacyCustomerFlags,
                | 'smsConsent'
                | 'emailConsent'
                | 'whatsappConsent'
                | 'notifyPanel'
                | 'notifySms'
                | 'notifyEmail'
                | 'notifyWhatsapp'
            >
        >,
        actor: ConsentActor,
        mode: 'legacy-self' | 'legacy-staff' | 'registration',
        registrationTextVersion?: string,
    ): Promise<void> {
        if (
            registrationTextVersion !== undefined &&
            (mode !== 'registration' ||
                registrationTextVersion !== REGISTRATION_DIRECT_MARKETING_TEXT_VERSION ||
                flags.smsConsent !== true ||
                flags.emailConsent !== true ||
                flags.whatsappConsent !== true)
        ) {
            throw new BadRequestException('Nieprawidłowa wersja zbiorczej zgody marketingowej.');
        }
        const customer = await this.lockCustomer(manager, customerId);
        const consents = await manager.find(CustomerConsent, {
            where: { customerId },
        });
        for (const [channel, column] of Object.entries(
            LEGACY_MARKETING_COLUMN,
        ) as [CommunicationChannel, keyof typeof flags][]) {
            const next = flags[column];
            if (next === undefined) continue;
            const row = consents.find(
                (c) =>
                    c.purpose === ConsentPurpose.DirectMarketing &&
                    c.channel === channel,
            );
            const granted = row?.status === ConsentStatus.Granted;
            const legacyValue = Boolean(customer[column as keyof User]);
            // Legacy forms resend every flag; act only on a real change so an
            // unverified legacy `true` is never promoted to a verified grant.
            if (next === legacyValue) continue;
            if (next && !granted) {
                if (mode === 'legacy-staff') {
                    throw new BadRequestException(
                        'Zgodę marketingową personel rejestruje przez formularz zgody z dowodem (źródło i numer dokumentu).',
                    );
                }
                const scope = findConsentScope(
                    ConsentPurpose.DirectMarketing,
                    channel,
                )!;
                await this.applyGrant(manager, customerId, actor, {
                    purpose: ConsentPurpose.DirectMarketing,
                    channel,
                    // Exactly the checkbox statement shown at registration
                    // (one statement / three audited channel-specific grants).
                    consentTextVersion:
                        registrationTextVersion ?? scope.textVersion,
                    source:
                        mode === 'registration'
                            ? ConsentSource.Registration
                            : ConsentSource.LegacySelfServiceForm,
                    evidenceReference: `${
                        mode === 'registration'
                            ? 'registration form'
                            : 'legacy account form'
                    }; authenticated user #${actor.id}`,
                    effectiveAt: new Date(),
                });
            } else if (!next) {
                await this.applyWithdraw(
                    manager,
                    customerId,
                    actor,
                    ConsentPurpose.DirectMarketing,
                    channel,
                    mode === 'legacy-staff'
                        ? ConsentSource.LegacyStaffForm
                        : ConsentSource.LegacySelfServiceForm,
                );
            }
        }

        const prefChanges: PreferenceChangeDto[] = [];
        const columnUpdates: Partial<Record<string, boolean>> = {};
        for (const [channel, column] of Object.entries(
            LEGACY_OPERATIONAL_COLUMN,
        ) as [CommunicationChannel, keyof typeof flags][]) {
            const next = flags[column];
            if (
                next === undefined ||
                next === Boolean(customer[column as keyof User])
            )
                continue;
            for (const def of COMMUNICATION_TYPES) {
                if (
                    def.class === CommunicationClass.Operational &&
                    def.supportedChannels.includes(channel)
                ) {
                    prefChanges.push({
                        communicationType: def.type,
                        channel,
                        enabled: Boolean(next),
                    });
                }
            }
            columnUpdates[column] = Boolean(next);
        }
        // Diff preferences against the state BEFORE the legacy default moves.
        if (prefChanges.length) {
            await this.applyPreferenceChanges(
                manager,
                customerId,
                actor,
                prefChanges,
                mode === 'legacy-staff'
                    ? ConsentSource.LegacyStaffForm
                    : ConsentSource.LegacySelfServiceForm,
            );
        }
        if (Object.keys(columnUpdates).length) {
            await manager.update(User, customerId, columnUpdates);
        }
    }

    // --------------------------------------------------------------- internal

    private assertMode(
        customerId: number,
        actor: ConsentActor,
        mode: 'staff' | 'self',
    ) {
        if (mode === 'self') {
            if (actor.id !== customerId) {
                throw new ForbiddenException();
            }
            return;
        }
        if (!STAFF_ROLES.has(actor.role)) throw new ForbiddenException();
    }

    private resolveGrantProvenance(
        customerId: number,
        dto: GrantConsentDto,
        mode: 'staff' | 'self',
    ): {
        source: ConsentSource;
        evidenceReference: string;
        effectiveAt: Date;
    } {
        this.assertCurrentText(
            dto.purpose,
            dto.channel,
            dto.consentTextVersion,
        );
        if (mode === 'self') {
            return {
                source: ConsentSource.SelfServicePanel,
                evidenceReference: `self-service panel; authenticated user #${customerId}`,
                effectiveAt: new Date(),
            };
        }
        if (!dto.source || !STAFF_GRANT_SOURCES.includes(dto.source)) {
            throw new BadRequestException(
                'Wskaż źródło zgody z dowodem: podpisany formularz, potwierdzenie e-mail lub nagrana rozmowa.',
            );
        }
        const evidence = dto.evidenceReference?.trim();
        if (!evidence || evidence.length < 3) {
            throw new BadRequestException(
                'Zgoda zarejestrowana przez personel wymaga odniesienia do dowodu.',
            );
        }
        let effectiveAt = new Date();
        if (dto.consentGivenAt) {
            const given = new Date(dto.consentGivenAt);
            if (Number.isNaN(given.getTime()) || given > new Date()) {
                throw new BadRequestException(
                    'Data udzielenia zgody nie może być z przyszłości.',
                );
            }
            effectiveAt = given;
        }
        return { source: dto.source, evidenceReference: evidence, effectiveAt };
    }

    private assertCurrentText(
        purpose: ConsentPurpose,
        channel: CommunicationChannel,
        version: string,
    ) {
        const scope = findConsentScope(purpose, channel);
        if (!scope) {
            throw new BadRequestException(
                `Zgoda ${purpose}/${channel} nie jest obsługiwana.`,
            );
        }
        if (scope.textVersion !== version) {
            throw new BadRequestException(
                'Treść zgody została zaktualizowana — odśwież formularz.',
            );
        }
    }

    private async mutate(
        customerId: number,
        idempotencyKey: string | undefined,
        payload: unknown,
        fn: (manager: EntityManager) => Promise<void>,
        audience: 'staff' | 'customer',
    ): Promise<CommunicationStateView> {
        return this.dataSource.transaction(async (manager) => {
            await this.lockCustomer(manager, customerId);
            if (idempotencyKey) {
                const key = idempotencyKey.trim().slice(0, 100);
                const hash = createHash('sha256')
                    .update(JSON.stringify(payload))
                    .digest('hex');
                const existing = await manager.findOne(ConsentRequest, {
                    where: { customerId, idempotencyKey: key },
                });
                if (existing) {
                    if (existing.payloadHash !== hash) {
                        throw new ConflictException(
                            'Idempotency-Key użyty z inną treścią żądania.',
                        );
                    }
                    return this.getState(customerId, audience, manager);
                }
                const request = await manager.save(ConsentRequest, {
                    customerId,
                    idempotencyKey: key,
                    payloadHash: hash,
                    createdAt: new Date(),
                });
                this.currentRequestId.set(manager, request.id);
            }
            try {
                await fn(manager);
            } finally {
                this.currentRequestId.delete(manager);
            }
            return this.getState(customerId, audience, manager);
        });
    }

    private readonly currentRequestId = new WeakMap<EntityManager, number>();

    private async lockCustomer(
        manager: EntityManager,
        customerId: number,
    ): Promise<User> {
        const customer = await manager
            .getRepository(User)
            .createQueryBuilder('u')
            .select(SELECT_FLAGS.map((f) => `u.${String(f)}`))
            .where('u.id = :id', { id: customerId })
            .setLock('pessimistic_write')
            .getOne();
        if (!customer || customer.role !== Role.Client) {
            throw new NotFoundException('Klient nie istnieje');
        }
        return customer;
    }

    private async applyGrant(
        manager: EntityManager,
        customerId: number,
        actor: ConsentActor,
        input: {
            purpose: ConsentPurpose;
            channel: CommunicationChannel;
            consentTextVersion: string;
            source: ConsentSource;
            evidenceReference: string;
            effectiveAt: Date;
        },
    ) {
        const repo = manager.getRepository(CustomerConsent);
        const existing = await repo.findOne({
            where: {
                customerId,
                purpose: input.purpose,
                channel: input.channel,
            },
        });
        if (existing?.status === ConsentStatus.Granted) return; // no-op
        const now = new Date();
        const previous = existing?.status ?? ConsentStatus.Unknown;
        const values = {
            status: ConsentStatus.Granted as const,
            source: input.source,
            actorId: actor.id,
            actorRole: actor.role,
            recordedAt: now,
            effectiveAt: input.effectiveAt,
            consentTextVersion: input.consentTextVersion,
            evidenceReference: input.evidenceReference,
        };
        if (existing) {
            await repo.update(existing.id, {
                ...values,
                version: existing.version + 1,
            });
        } else {
            await repo.insert({
                customerId,
                purpose: input.purpose,
                channel: input.channel,
                ...values,
                version: 1,
            });
        }
        await this.syncLegacyMarketing(
            manager,
            customerId,
            input.purpose,
            input.channel,
            true,
        );
        await this.insertEvent(manager, {
            customerId,
            actor,
            source: input.source,
            purpose: input.purpose,
            communicationType: null,
            channel: input.channel,
            eventType: ConsentEventType.Granted,
            previousStatus: previous,
            newStatus: ConsentStatus.Granted,
            occurredAt: now,
            consentTextVersion: input.consentTextVersion,
            evidenceReference: input.evidenceReference,
        });
    }

    private async applyWithdraw(
        manager: EntityManager,
        customerId: number,
        actor: ConsentActor,
        purpose: ConsentPurpose,
        channel: CommunicationChannel,
        source: ConsentSource,
    ) {
        if (!findConsentScope(purpose, channel)) {
            throw new BadRequestException(
                `Zgoda ${purpose}/${channel} nie jest obsługiwana.`,
            );
        }
        const repo = manager.getRepository(CustomerConsent);
        const existing = await repo.findOne({
            where: { customerId, purpose, channel },
        });
        if (existing?.status === ConsentStatus.Withdrawn) return; // no-op
        const now = new Date();
        const values = {
            status: ConsentStatus.Withdrawn as const,
            source,
            actorId: actor.id,
            actorRole: actor.role,
            recordedAt: now,
            effectiveAt: now,
            consentTextVersion: existing?.consentTextVersion ?? null,
            evidenceReference: null,
        };
        if (existing) {
            await repo.update(existing.id, {
                ...values,
                version: existing.version + 1,
            });
        } else {
            await repo.insert({
                customerId,
                purpose,
                channel,
                ...values,
                version: 1,
            });
        }
        await this.syncLegacyMarketing(
            manager,
            customerId,
            purpose,
            channel,
            false,
        );
        await this.insertEvent(manager, {
            customerId,
            actor,
            source,
            purpose,
            communicationType: null,
            channel,
            eventType: ConsentEventType.Withdrawn,
            previousStatus: existing?.status ?? ConsentStatus.Unknown,
            newStatus: ConsentStatus.Withdrawn,
            occurredAt: now,
            consentTextVersion: existing?.consentTextVersion ?? null,
            evidenceReference: null,
        });
    }

    private async applyPreferenceChanges(
        manager: EntityManager,
        customerId: number,
        actor: ConsentActor,
        changes: PreferenceChangeDto[],
        source: ConsentSource,
    ) {
        const seen = new Set<string>();
        for (const change of changes) {
            const key = `${change.communicationType}:${change.channel}`;
            if (seen.has(key)) {
                throw new BadRequestException(
                    `Zduplikowana zmiana preferencji ${key}`,
                );
            }
            seen.add(key);
            const def = getTypeDefinition(change.communicationType);
            if (!def.supportedChannels.includes(change.channel)) {
                throw new BadRequestException(
                    `Kanał ${change.channel} nie jest obsługiwany dla ${change.communicationType}.`,
                );
            }
        }

        const { customer, consents, preferences } = await this.load(
            manager,
            customerId,
        );
        const repo = manager.getRepository(CommunicationPreference);
        const now = new Date();
        for (const change of changes) {
            const current = evaluatePreference(
                customer,
                consents,
                preferences,
                change.communicationType,
                change.channel,
            );
            if (current.preferred === change.enabled) continue; // no-op
            const existing = preferences.find(
                (p) =>
                    p.communicationType === change.communicationType &&
                    p.channel === change.channel,
            );
            if (existing) {
                await repo.update(existing.id, {
                    enabled: change.enabled,
                    updatedAt: now,
                    updatedById: actor.id,
                    version: existing.version + 1,
                });
                existing.enabled = change.enabled;
            } else {
                const inserted = repo.create({
                    customerId,
                    communicationType: change.communicationType,
                    channel: change.channel,
                    enabled: change.enabled,
                    updatedAt: now,
                    updatedById: actor.id,
                    version: 1,
                });
                await repo.insert(inserted);
                preferences.push(inserted);
            }
            await this.insertEvent(manager, {
                customerId,
                actor,
                source,
                purpose: null,
                communicationType: change.communicationType,
                channel: change.channel,
                eventType: change.enabled
                    ? ConsentEventType.PreferenceEnabled
                    : ConsentEventType.PreferenceDisabled,
                previousStatus:
                    current.preferred === null
                        ? null
                        : current.preferred
                          ? 'ENABLED'
                          : 'DISABLED',
                newStatus: change.enabled ? 'ENABLED' : 'DISABLED',
                occurredAt: now,
                consentTextVersion: null,
                evidenceReference: null,
            });
        }
    }

    private async syncLegacyMarketing(
        manager: EntityManager,
        customerId: number,
        purpose: ConsentPurpose,
        channel: CommunicationChannel,
        value: boolean,
    ) {
        const column = LEGACY_MARKETING_COLUMN[channel];
        if (purpose !== ConsentPurpose.DirectMarketing || !column) return;
        await manager.update(User, customerId, { [column]: value });
    }

    private async insertEvent(
        manager: EntityManager,
        input: Omit<
            ConsentEvent,
            'id' | 'actorId' | 'actorRole' | 'requestId' | 'customer'
        > & { actor: ConsentActor },
    ) {
        const { actor, ...rest } = input;
        await manager.insert(ConsentEvent, {
            ...rest,
            actorId: actor.id,
            actorRole: actor.role,
            requestId: this.currentRequestId.get(manager) ?? null,
        });
    }

    private async requireCustomer(manager: EntityManager, customerId: number) {
        const customer = await manager.findOne(User, {
            where: { id: customerId },
            select: SELECT_FLAGS,
        });
        if (!customer || customer.role !== Role.Client) {
            throw new NotFoundException('Klient nie istnieje');
        }
        return customer;
    }

    private async load(
        manager: EntityManager,
        customerId: number,
        strict = true,
    ) {
        const customer = strict
            ? await this.requireCustomer(manager, customerId)
            : await manager.findOne(User, {
                  where: { id: customerId },
                  select: SELECT_FLAGS,
              });
        if (!customer) {
            return {
                customer: null as unknown as User,
                consents: [],
                preferences: [],
            };
        }
        const [consents, preferences] = await Promise.all([
            manager.find(CustomerConsent, { where: { customerId } }),
            manager.find(CommunicationPreference, { where: { customerId } }),
        ]);
        return { customer, consents, preferences };
    }

    private buildView(
        customer: User,
        consents: CustomerConsent[],
        preferences: CommunicationPreference[],
        audience: 'staff' | 'customer',
    ): CommunicationStateView {
        const consentViews: ConsentScopeView[] = CONSENT_SCOPES.map((scope) => {
            const row = consents.find(
                (c) =>
                    c.purpose === scope.purpose && c.channel === scope.channel,
            );
            const legacyColumn = LEGACY_MARKETING_COLUMN[scope.channel];
            const view: ConsentScopeView = {
                purpose: scope.purpose,
                channel: scope.channel,
                label: scope.label,
                status: row
                    ? (row.status as ConsentStatus)
                    : ConsentStatus.Unknown,
                legacyUnverifiedConsent:
                    !row &&
                    scope.purpose === ConsentPurpose.DirectMarketing &&
                    Boolean(legacyColumn && customer[legacyColumn]),
                currentTextVersion: scope.textVersion,
                recordedAt: row?.recordedAt?.toISOString() ?? null,
                effectiveAt: row?.effectiveAt?.toISOString() ?? null,
                source: row?.source ?? null,
                consentTextVersion: row?.consentTextVersion ?? null,
                actorRole: row?.actorRole ?? null,
            };
            if (audience === 'staff') {
                view.evidenceReference = row?.evidenceReference ?? null;
            }
            return view;
        });

        const preferenceViews: PreferenceEvaluation[] = [];
        for (const def of COMMUNICATION_TYPES) {
            for (const channel of Object.values(CommunicationChannel)) {
                preferenceViews.push(
                    evaluatePreference(
                        customer,
                        consents,
                        preferences,
                        def.type,
                        channel,
                    ),
                );
            }
        }

        return {
            customerId: customer.id,
            receiveNotifications: customer.receiveNotifications,
            contact: {
                hasPhone: Boolean(customer.phone),
                hasEmail: Boolean(customer.email),
            },
            consents: consentViews,
            preferences: preferenceViews,
            updatedAt: new Date().toISOString(),
        };
    }

    /**
     * Read-only view of pre-existing CONSENT_UPDATED log entries (legacy,
     * best-effort, not a complete audit). Returned separately and labelled.
     */
    private async legacyHistory(customerId: number) {
        if (!this.logService) return [];
        try {
            const { data } = await this.logService.findAll({
                userId: customerId,
                action: LogAction.CONSENT_UPDATED,
                page: 1,
                limit: 100,
            });
            return data.flatMap((entry) => {
                const raw = entry.description;
                if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
                    return [];
                }
                const details = raw;
                const owner = details.customerId ?? details.userId;
                if (owner !== customerId) return [];
                const changes = details.changes;
                if (!changes || typeof changes !== 'object') return [];
                return Object.entries(
                    changes as Record<string, unknown>,
                ).flatMap(([field, value]) => {
                    const change = value as Record<string, unknown> | null;
                    if (
                        !change ||
                        typeof change.from !== 'boolean' ||
                        typeof change.to !== 'boolean'
                    ) {
                        return [];
                    }
                    return [
                        {
                            id: `legacy:${entry.id}:${field}`,
                            timestamp: entry.timestamp.toISOString(),
                            field,
                            previous: change.from,
                            current: change.to,
                            actorId:
                                typeof details.actorId === 'number'
                                    ? details.actorId
                                    : null,
                        },
                    ];
                });
            });
        } catch (cause) {
            this.logger.warn(
                `Legacy consent log read failed for customer ${customerId}: ${String(cause)}`,
            );
            return [];
        }
    }
}
