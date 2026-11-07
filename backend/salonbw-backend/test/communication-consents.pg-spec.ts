import { join } from 'node:path';
import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from '../src/users/user.entity';
import { Role } from '../src/users/role.enum';
import { CommunicationConsentsService } from '../src/communication-consents/communication-consents.service';
import { CommunicationEligibilityService } from '../src/communication-consents/communication-eligibility.service';
import { CustomersService } from '../src/customers/customers.service';
import { CustomerConsent } from '../src/communication-consents/entities/customer-consent.entity';
import { ConsentEvent } from '../src/communication-consents/entities/consent-event.entity';
import {
    CommunicationChannel as Ch,
    CommunicationType as T,
    ConsentPurpose as P,
    ConsentSource,
    ConsentStatus,
    EligibilityReason,
    findConsentScope,
} from '../src/communication-consents/communication-consent.types';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeWithPostgres = testDatabaseUrl ? describe : describe.skip;

const SMS_TEXT = findConsentScope(P.DirectMarketing, Ch.Sms)!.textVersion;
const EMAIL_TEXT = findConsentScope(P.DirectMarketing, Ch.Email)!.textVersion;

describeWithPostgres('Communication consents (PostgreSQL)', () => {
    let dataSource: DataSource;
    let users: Repository<User>;
    let consents: CommunicationConsentsService;
    let eligibility: CommunicationEligibilityService;
    let customers: CustomersService;
    let staff: User;
    let seq = 0;

    const staffActor = () => ({ id: staff.id, role: Role.Receptionist });
    const newClient = async (over: Partial<User> = {}) => {
        seq++;
        return users.save(
            users.create({
                email: `client${seq}-${Date.now()}@example.test`,
                password: 'x',
                name: `Client ${seq}`,
                role: Role.Client,
                phone: `+48 600 000 ${String(100 + seq).padStart(3, '0')}`,
                commissionBase: 0,
                receiveNotifications: true,
                notifySms: true,
                notifyEmail: true,
                ...over,
            }),
        );
    };
    const events = (customerId: number) =>
        dataSource
            .getRepository(ConsentEvent)
            .find({ where: { customerId }, order: { id: 'ASC' } });
    const staffGrant = (customerId: number, key?: string) =>
        consents.grantConsent(
            customerId,
            {
                purpose: P.DirectMarketing,
                channel: Ch.Sms,
                consentTextVersion: SMS_TEXT,
                source: ConsentSource.InPersonSignedForm,
                evidenceReference: 'Formularz F/2026/11/07-1',
            },
            staffActor(),
            'staff',
            key,
        );

    beforeAll(async () => {
        dataSource = new DataSource({
            type: 'postgres',
            url: testDatabaseUrl,
            entities: [join(__dirname, '../src/**/*.entity.{ts,js}')],
            migrations: [join(__dirname, '../src/migrations/*{ts,js}')],
            migrationsRun: true,
            dropSchema: true,
            synchronize: false,
        });
        await dataSource.initialize();
        users = dataSource.getRepository(User);
        consents = new CommunicationConsentsService(dataSource);
        eligibility = new CommunicationEligibilityService(consents, users);
        const unused = {} as Repository<never>;
        customers = new CustomersService(
            null,
            users,
            unused,
            unused,
            unused,
            unused,
            unused,
            unused,
            consents,
        );
        staff = await users.save(
            users.create({
                email: `staff-${Date.now()}@example.test`,
                password: 'x',
                name: 'Recepcja',
                role: Role.Receptionist,
                commissionBase: 0,
            }),
        );
    });

    afterAll(async () => {
        await dataSource?.destroy();
    });

    it('persists consent state and its audit event atomically', async () => {
        const client = await newClient();
        const state = await staffGrant(client.id);
        const sms = state.consents.find(
            (c) => c.purpose === P.DirectMarketing && c.channel === Ch.Sms,
        )!;
        expect(sms.status).toBe(ConsentStatus.Granted);
        expect(sms.evidenceReference).toBe('Formularz F/2026/11/07-1');
        const [event] = await events(client.id);
        expect(event).toMatchObject({
            eventType: 'GRANTED',
            previousStatus: 'UNKNOWN',
            newStatus: 'GRANTED',
            actorId: staff.id,
            actorRole: Role.Receptionist,
            source: ConsentSource.InPersonSignedForm,
            consentTextVersion: SMS_TEXT,
        });
        // Legacy column mirrors the audited state for old readers.
        expect(
            (await users.findOneByOrFail({ id: client.id })).smsConsent,
        ).toBe(true);
    });

    it('rolls back the state change when the audit insert fails', async () => {
        const client = await newClient();
        await dataSource.query(`
            CREATE OR REPLACE FUNCTION test_fail_consent_event() RETURNS trigger AS $$
            BEGIN RAISE EXCEPTION 'audit store down'; END; $$ LANGUAGE plpgsql`);
        await dataSource.query(
            `CREATE TRIGGER test_fail_consent_event BEFORE INSERT ON consent_events
             FOR EACH ROW EXECUTE FUNCTION test_fail_consent_event()`,
        );
        try {
            await expect(staffGrant(client.id)).rejects.toThrow(
                'audit store down',
            );
        } finally {
            await dataSource.query(
                'DROP TRIGGER test_fail_consent_event ON consent_events',
            );
        }
        expect(
            await dataSource
                .getRepository(CustomerConsent)
                .count({ where: { customerId: client.id } }),
        ).toBe(0);
        expect(
            (await users.findOneByOrFail({ id: client.id })).smsConsent,
        ).toBe(false);
    });

    it('rejects staff grants without evidence and a current statement', async () => {
        const client = await newClient();
        await expect(
            consents.grantConsent(
                client.id,
                {
                    purpose: P.DirectMarketing,
                    channel: Ch.Sms,
                    consentTextVersion: SMS_TEXT,
                },
                staffActor(),
                'staff',
            ),
        ).rejects.toBeInstanceOf(BadRequestException);
        await expect(
            consents.grantConsent(
                client.id,
                {
                    purpose: P.DirectMarketing,
                    channel: Ch.Sms,
                    consentTextVersion: 'outdated-v0',
                    source: ConsentSource.InPersonSignedForm,
                    evidenceReference: 'F-1',
                },
                staffActor(),
                'staff',
            ),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(await events(client.id)).toHaveLength(0);
    });

    it('is idempotent per key and rejects key reuse with another payload', async () => {
        const client = await newClient();
        await staffGrant(client.id, 'key-1');
        await staffGrant(client.id, 'key-1');
        expect(await events(client.id)).toHaveLength(1);
        await expect(
            consents.withdrawConsent(
                client.id,
                { purpose: P.DirectMarketing, channel: Ch.Sms },
                staffActor(),
                'staff',
                'key-1',
            ),
        ).rejects.toBeInstanceOf(ConflictException);
    });

    it('serialises concurrent changes without lost updates or duplicate events', async () => {
        const client = await newClient();
        await Promise.all([
            staffGrant(client.id),
            staffGrant(client.id),
            staffGrant(client.id),
        ]);
        expect(await events(client.id)).toHaveLength(1);

        await Promise.all([
            consents.withdrawConsent(
                client.id,
                { purpose: P.DirectMarketing, channel: Ch.Sms },
                staffActor(),
                'staff',
            ),
            consents.withdrawConsent(
                client.id,
                { purpose: P.DirectMarketing, channel: Ch.Sms },
                { id: client.id, role: Role.Client },
                'self',
            ),
        ]);
        const all = await events(client.id);
        expect(all.map((e) => e.eventType)).toEqual(['GRANTED', 'WITHDRAWN']);
        const row = await dataSource
            .getRepository(CustomerConsent)
            .findOneByOrFail({
                customerId: client.id,
                purpose: P.DirectMarketing,
                channel: Ch.Sms,
            });
        expect(row.status).toBe(ConsentStatus.Withdrawn);
        expect(row.version).toBe(2);
    });

    it('keeps consent_events append-only but survives actor deletion', async () => {
        const client = await newClient();
        const tempStaff = await users.save(
            users.create({
                email: `temp-${Date.now()}@example.test`,
                password: 'x',
                name: 'Temp',
                role: Role.Employee,
                commissionBase: 0,
            }),
        );
        await consents.withdrawConsent(
            client.id,
            { purpose: P.DirectMarketing, channel: Ch.Email },
            { id: tempStaff.id, role: Role.Employee },
            'staff',
        );
        const [event] = await events(client.id);
        await expect(
            dataSource.query(
                `UPDATE consent_events SET new_status = 'GRANTED' WHERE id = $1`,
                [event.id],
            ),
        ).rejects.toThrow('append-only');
        await users.delete(tempStaff.id);
        const [after] = await events(client.id);
        expect(after.actorId).toBeNull();
        expect(after.newStatus).toBe('WITHDRAWN');
        expect(after.actorRole).toBe(Role.Employee);
    });

    it('lets a customer manage only their own consents', async () => {
        const a = await newClient();
        const b = await newClient();
        await expect(
            consents.grantConsent(
                b.id,
                {
                    purpose: P.DirectMarketing,
                    channel: Ch.Email,
                    consentTextVersion: EMAIL_TEXT,
                },
                { id: a.id, role: Role.Client },
                'self',
            ),
        ).rejects.toBeInstanceOf(ForbiddenException);
        await expect(
            consents.grantConsent(
                a.id,
                {
                    purpose: P.DirectMarketing,
                    channel: Ch.Email,
                    consentTextVersion: EMAIL_TEXT,
                },
                { id: a.id, role: Role.Client },
                'staff',
            ),
        ).rejects.toBeInstanceOf(ForbiddenException);

        // Self-service grant ignores any client-provided source/evidence.
        await consents.grantConsent(
            a.id,
            {
                purpose: P.DirectMarketing,
                channel: Ch.Email,
                consentTextVersion: EMAIL_TEXT,
                source: ConsentSource.InPersonSignedForm,
                evidenceReference: 'forged',
            },
            { id: a.id, role: Role.Client },
            'self',
        );
        const [event] = await events(a.id);
        expect(event.source).toBe(ConsentSource.SelfServicePanel);
        expect(event.evidenceReference).not.toBe('forged');
        expect(event.actorId).toBe(a.id);
        expect(await events(b.id)).toHaveLength(0);
    });

    it('paginates history and hides staff metadata from the customer', async () => {
        const client = await newClient();
        await staffGrant(client.id);
        await consents.withdrawConsent(
            client.id,
            { purpose: P.DirectMarketing, channel: Ch.Sms },
            staffActor(),
            'staff',
        );
        await consents.updatePreferences(
            client.id,
            [
                {
                    communicationType: T.AppointmentReminder,
                    channel: Ch.Sms,
                    enabled: false,
                },
            ],
            { id: client.id, role: Role.Client },
            'self',
        );
        const page1 = await consents.getHistory(client.id, 'staff', 1, 2);
        expect(page1.total).toBe(3);
        expect(page1.items).toHaveLength(2);
        expect(page1.items[0].eventType).toBe('PREFERENCE_DISABLED');
        const own = await consents.getHistory(client.id, 'customer', 1, 10);
        expect(own.items).toHaveLength(3);
        expect(own.items[0]).not.toHaveProperty('evidenceReference');
        expect(own.items[0]).not.toHaveProperty('actorId');
        expect(own.legacyItems).toEqual([]);
    });

    it('enforces withdrawal and per-channel consent at send time', async () => {
        const client = await newClient();
        const check = (type: T, channel: Ch) =>
            eligibility.canSend({
                customerId: client.id,
                communicationType: type,
                channel,
            });

        expect((await check(T.MassMarketing, Ch.Sms)).reason).toBe(
            EligibilityReason.MarketingConsentMissing,
        );
        await staffGrant(client.id);
        expect((await check(T.MassMarketing, Ch.Sms)).allowed).toBe(true);
        expect((await check(T.MassMarketing, Ch.Email)).allowed).toBe(false);
        expect((await check(T.PostVisitReview, Ch.Sms)).allowed).toBe(false);
        await consents.withdrawConsent(
            client.id,
            { purpose: P.DirectMarketing, channel: Ch.Sms },
            { id: client.id, role: Role.Client },
            'self',
        );
        expect((await check(T.MassMarketing, Ch.Sms)).reason).toBe(
            EligibilityReason.MarketingConsentWithdrawn,
        );
        // Operational reminders are unaffected by marketing withdrawal.
        expect((await check(T.AppointmentReminder, Ch.Sms)).allowed).toBe(true);
        // Disabling the reminder preference leaves booking confirmations alone.
        await consents.updatePreferences(
            client.id,
            [
                {
                    communicationType: T.AppointmentReminder,
                    channel: Ch.Sms,
                    enabled: false,
                },
            ],
            staffActor(),
            'staff',
        );
        expect((await check(T.AppointmentReminder, Ch.Sms)).allowed).toBe(
            false,
        );
        expect((await check(T.BookingConfirmation, Ch.Sms)).allowed).toBe(true);
    });

    it('never promotes an unverified legacy flag and denies it for marketing', async () => {
        const client = await newClient({ smsConsent: true });
        const state = await consents.getState(client.id, 'staff');
        const sms = state.consents.find(
            (c) => c.purpose === P.DirectMarketing && c.channel === Ch.Sms,
        )!;
        expect(sms.status).toBe(ConsentStatus.Unknown);
        expect(sms.legacyUnverifiedConsent).toBe(true);
        expect(
            (
                await eligibility.canSend({
                    customerId: client.id,
                    communicationType: T.MassMarketing,
                    channel: Ch.Sms,
                })
            ).reason,
        ).toBe(EligibilityReason.LegacyConsentUnverified);

        // Old account form re-sends the same `true`: still no grant.
        await dataSource.transaction((m) =>
            consents.applyLegacyFlags(
                m,
                client.id,
                { smsConsent: true, emailConsent: false },
                { id: client.id, role: Role.Client },
                'legacy-self',
            ),
        );
        expect(await events(client.id)).toHaveLength(0);
    });

    it('creates a customer and initial consents atomically', async () => {
        const email = `atomic-${Date.now()}@example.test`;
        await expect(
            customers.create(
                {
                    firstName: 'Ala',
                    lastName: 'Atomowa',
                    email,
                    communication: {
                        grants: [
                            {
                                purpose: P.DirectMarketing,
                                channel: Ch.Sms,
                                consentTextVersion: SMS_TEXT,
                            },
                        ],
                        // missing source/evidence → whole creation rolls back
                    },
                },
                staffActor(),
            ),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(await users.count({ where: { email } })).toBe(0);

        const created = await customers.create(
            {
                firstName: 'Ala',
                lastName: 'Atomowa',
                email,
                communication: {
                    grants: [
                        {
                            purpose: P.DirectMarketing,
                            channel: Ch.Sms,
                            consentTextVersion: SMS_TEXT,
                        },
                    ],
                    source: ConsentSource.InPersonSignedForm,
                    evidenceReference: 'Karta klienta nr 77',
                    preferences: [
                        {
                            communicationType: T.AppointmentReminder,
                            channel: Ch.Email,
                            enabled: false,
                        },
                    ],
                },
            },
            staffActor(),
        );
        const types = (await events(created.id!)).map((e) => e.eventType);
        expect(types).toEqual(['GRANTED', 'PREFERENCE_DISABLED']);

        // Marketing is never a pre-ticked plain boolean on creation.
        await expect(
            customers.create(
                { firstName: 'Bez', lastName: 'Dowodu', smsConsent: true },
                staffActor(),
            ),
        ).rejects.toBeInstanceOf(BadRequestException);
    });
});
