import { BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { promisify } from 'node:util';
import { DataSource, Repository } from 'typeorm';

import {
    Appointment,
    AppointmentStatus,
    PaymentMethod,
} from '../src/appointments/appointment.entity';
import { AppointmentMessage } from '../src/appointments/appointment-message.entity';
import { AppointmentsController } from '../src/appointments/appointments.controller';
import { AppointmentsService } from '../src/appointments/appointments.service';
import { CalendarSettings } from '../src/settings/entities/calendar-settings.entity';
import { Service, PriceType } from '../src/services/service.entity';
import { ServiceRecipeItem } from '../src/services/entities/service-recipe-item.entity';
import { ServiceVariant } from '../src/services/entities/service-variant.entity';
import { ServiceCategory } from '../src/services/entities/service-category.entity';
import { EmployeeService } from '../src/services/entities/employee-service.entity';
import { Role } from '../src/users/role.enum';
import { User } from '../src/users/user.entity';
import { Product, ProductType } from '../src/products/product.entity';
import { Commission } from '../src/commissions/commission.entity';
import { CommissionRule } from '../src/commissions/commission-rule.entity';
import { CommissionsService } from '../src/commissions/commissions.service';
import { Formula } from '../src/formulas/formula.entity';
import { RetailService } from '../src/retail/retail.service';
import { PricingService } from '../src/finance/pricing.service';
import { WarehouseSale } from '../src/warehouse/entities/warehouse-sale.entity';
import { WarehouseSaleItem } from '../src/warehouse/entities/warehouse-sale-item.entity';
import { WarehouseUsage } from '../src/warehouse/entities/warehouse-usage.entity';
import { WarehouseUsageItem } from '../src/warehouse/entities/warehouse-usage-item.entity';
import { EmailsService } from '../src/emails/emails.service';
import { AutomaticReminderService } from '../src/notifications/automatic-reminder.service';
import { NotificationsController } from '../src/notifications/notifications.controller';
import { SmsService } from '../src/sms/sms.service';
import {
    MessageChannel,
    MessageTemplate,
    TemplateType,
} from '../src/sms/entities/message-template.entity';
import {
    ReminderChannel,
    ReminderSettings,
} from '../src/settings/entities/reminder-settings.entity';
import { SeparateOperationalNotificationPreferences1762570000000 } from '../src/migrations/1762570000000-SeparateOperationalNotificationPreferences';
import { AddReminderRetryState1762590000000 } from '../src/migrations/1762590000000-AddReminderRetryState';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeWithPostgres = testDatabaseUrl ? describe : describe.skip;
const execFileAsync = promisify(execFile);

describeWithPostgres('PostgreSQL business invariants', () => {
    let dataSource: DataSource;

    beforeAll(async () => {
        const migrationWarning = jest
            .spyOn(console, 'warn')
            .mockImplementation(() => undefined);
        dataSource = new DataSource({
            type: 'postgres',
            url: testDatabaseUrl,
            entities: [join(__dirname, '../src/**/*.entity.{ts,js}')],
            migrations: [join(__dirname, '../src/migrations/*{ts,js}')],
            migrationsRun: true,
            dropSchema: true,
            synchronize: false,
        });
        try {
            await dataSource.initialize();
        } finally {
            migrationWarning.mockRestore();
        }
        // Dropping the schema and replaying every migration takes well over
        // the default hook budget on a loaded CI runner.
    }, 120_000);

    afterAll(async () => {
        if (dataSource?.isInitialized) await dataSource.destroy();
    });

    it('persists only one of two simultaneous online bookings for the same slot', async () => {
        const users = dataSource.getRepository(User);
        const services = dataSource.getRepository(Service);
        const appointments = dataSource.getRepository(Appointment);

        const [firstClient, secondClient, employee] = await users.save([
            userFixture('first-client@example.invalid', Role.Client),
            userFixture('second-client@example.invalid', Role.Client),
            userFixture('owner@example.invalid', Role.Admin),
        ]);
        const salonService = await services.save({
            name: 'Concurrency test service',
            description: 'Isolated PostgreSQL test fixture',
            duration: 60,
            price: 100,
            priceType: PriceType.Fixed,
            isActive: true,
            onlineBooking: true,
        });

        // Keep both inserts open briefly. Without a lock, both conflict reads
        // finish while the slot is still absent, making the race deterministic.
        await dataSource.query(`
            CREATE OR REPLACE FUNCTION delay_test_appointment_insert()
            RETURNS trigger AS $$
            BEGIN
                PERFORM pg_sleep(0.15);
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql
        `);
        await dataSource.query(`
            CREATE TRIGGER delay_test_appointment_insert_trigger
            BEFORE INSERT ON appointments
            FOR EACH ROW EXECUTE FUNCTION delay_test_appointment_insert()
        `);

        const appointmentService = createService(dataSource);
        const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const attempts = await Promise.allSettled([
            appointmentService.create(
                bookingInput(firstClient, employee, salonService, startTime),
                firstClient,
            ),
            appointmentService.create(
                bookingInput(secondClient, employee, salonService, startTime),
                secondClient,
            ),
        ]);

        const accepted = attempts.filter(
            ({ status }) => status === 'fulfilled',
        );
        const rejected = attempts.filter(({ status }) => status === 'rejected');
        expect(accepted).toHaveLength(1);
        expect(rejected).toHaveLength(1);
        expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(
            ConflictException,
        );
        expect(
            await appointments.count({
                where: { status: AppointmentStatus.OnlinePending },
            }),
        ).toBe(1);
    });

    it('persists only one of two simultaneous reschedules for the same slot', async () => {
        const users = dataSource.getRepository(User);
        const services = dataSource.getRepository(Service);
        const appointments = dataSource.getRepository(Appointment);
        const calendarSettings = dataSource.getRepository(CalendarSettings);
        const [settings] = await calendarSettings.find({ take: 1 });
        settings.allowOverlappingAppointments = false;
        await calendarSettings.save(settings);
        const [firstClient, secondClient, employee] = await users.save([
            userFixture('reschedule-first@example.invalid', Role.Client),
            userFixture('reschedule-second@example.invalid', Role.Client),
            userFixture('reschedule-owner@example.invalid', Role.Admin),
        ]);
        const salonService = await services.save({
            name: 'Reschedule concurrency service',
            description: 'Isolated PostgreSQL test fixture',
            duration: 60,
            price: 100,
            priceType: PriceType.Fixed,
            isActive: true,
            onlineBooking: true,
        });
        const appointmentService = createService(dataSource);
        const now = Date.now();
        const first = await appointmentService.create(
            bookingInput(
                firstClient,
                employee,
                salonService,
                new Date(now + 72 * 60 * 60 * 1000),
            ),
            employee,
        );
        const second = await appointmentService.create(
            bookingInput(
                secondClient,
                employee,
                salonService,
                new Date(now + 74 * 60 * 60 * 1000),
            ),
            employee,
        );
        const targetStart = new Date(now + 60 * 60 * 60 * 1000);

        // Keep both updates open briefly. Without schedule serialization, both
        // conflict reads complete while the target slot is still empty.
        await dataSource.query(`
            CREATE OR REPLACE FUNCTION delay_test_appointment_update()
            RETURNS trigger AS $$
            BEGIN
                PERFORM pg_sleep(0.15);
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql
        `);
        await dataSource.query(`
            CREATE TRIGGER delay_test_appointment_update_trigger
            BEFORE UPDATE ON appointments
            FOR EACH ROW
            WHEN (NEW."startTime" IS DISTINCT FROM OLD."startTime")
            EXECUTE FUNCTION delay_test_appointment_update()
        `);

        const attempts = await Promise.allSettled([
            appointmentService.reschedule(
                first.id,
                targetStart,
                undefined,
                undefined,
                false,
                employee,
            ),
            appointmentService.reschedule(
                second.id,
                targetStart,
                undefined,
                undefined,
                false,
                employee,
            ),
        ]);

        const accepted = attempts.filter(
            ({ status }) => status === 'fulfilled',
        );
        const rejected = attempts.filter(({ status }) => status === 'rejected');
        expect(accepted).toHaveLength(1);
        expect(rejected).toHaveLength(1);
        expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(
            ConflictException,
        );
        expect(
            await appointments.count({
                where: {
                    employee: { id: employee.id },
                    startTime: targetStart,
                },
            }),
        ).toBe(1);
    });

    it('persists checkout side effects only once during concurrent finalization', async () => {
        const users = dataSource.getRepository(User);
        const services = dataSource.getRepository(Service);
        const products = dataSource.getRepository(Product);
        const appointments = dataSource.getRepository(Appointment);
        const commissions = dataSource.getRepository(Commission);
        const formulas = dataSource.getRepository(Formula);
        const sales = dataSource.getRepository(WarehouseSale);
        const usages = dataSource.getRepository(WarehouseUsage);
        const [client, owner] = await users.save([
            {
                ...userFixture('finalize-client@example.invalid', Role.Client),
                receiveNotifications: false,
            },
            {
                ...userFixture('finalize-owner@example.invalid', Role.Admin),
                receiveNotifications: false,
                commissionBase: 5,
            },
        ]);
        const salonService = await services.save({
            name: 'Concurrent finalization service',
            description: 'Isolated PostgreSQL finalization fixture',
            duration: 60,
            price: 100,
            priceType: PriceType.Fixed,
            commissionPercent: 10,
            isActive: true,
            onlineBooking: true,
        });
        const [retailProduct, treatmentMaterial] = await products.save([
            {
                name: 'Concurrent retail product',
                productType: ProductType.Product,
                unitPrice: 30,
                vatRate: 23,
                purchasePrice: 10,
                stock: 5,
                unit: 'op.',
                isActive: true,
                trackStock: true,
            },
            {
                name: 'Concurrent treatment material',
                productType: ProductType.Supply,
                unitPrice: 20,
                vatRate: 23,
                purchasePrice: 8,
                stock: 10,
                unit: 'g',
                isActive: true,
                trackStock: true,
            },
        ]);
        const { appointmentService } = createLifecycleService(dataSource);
        const appointment = await appointmentService.create(
            bookingInput(
                client,
                owner,
                salonService,
                new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
            ),
            owner,
        );

        // Both requests read the old status before either UPDATE finishes.
        // A transaction-level row lock must force the second request to
        // re-check the status before writing any checkout side effects.
        await dataSource.query(`
            CREATE OR REPLACE FUNCTION delay_test_appointment_finalization()
            RETURNS trigger AS $$
            BEGIN
                PERFORM pg_sleep(0.2);
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql
        `);
        await dataSource.query(`
            CREATE TRIGGER delay_test_appointment_finalization_trigger
            BEFORE UPDATE ON appointments
            FOR EACH ROW
            WHEN (
                NEW.status = 'completed'
                AND OLD.status IS DISTINCT FROM NEW.status
            )
            EXECUTE FUNCTION delay_test_appointment_finalization()
        `);

        const checkout = {
            paymentMethod: PaymentMethod.Card,
            paidAmountCents: 13000,
            products: [
                {
                    productId: retailProduct.id,
                    quantity: 1,
                    unitPriceCents: 3000,
                },
            ],
            usageItems: [
                {
                    productId: treatmentMaterial.id,
                    quantity: 2,
                    unit: 'g',
                },
            ],
            formula: 'Testowa formuła 1:1',
        };
        let attempts: PromiseSettledResult<Appointment | null>[];
        try {
            attempts = await Promise.allSettled([
                appointmentService.finalizeAppointment(
                    appointment.id,
                    checkout,
                    owner,
                ),
                appointmentService.finalizeAppointment(
                    appointment.id,
                    checkout,
                    owner,
                ),
            ]);
        } finally {
            await dataSource.query(
                'DROP TRIGGER IF EXISTS delay_test_appointment_finalization_trigger ON appointments',
            );
            await dataSource.query(
                'DROP FUNCTION IF EXISTS delay_test_appointment_finalization()',
            );
        }

        expect(
            attempts.filter(({ status }) => status === 'fulfilled'),
        ).toHaveLength(1);
        const rejected = attempts.filter(({ status }) => status === 'rejected');
        expect(rejected).toHaveLength(1);
        expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(
            BadRequestException,
        );
        expect(
            await formulas.countBy({ appointment: { id: appointment.id } }),
        ).toBe(1);
        expect(await sales.countBy({ appointmentId: appointment.id })).toBe(1);
        expect(await usages.countBy({ appointmentId: appointment.id })).toBe(1);
        expect(
            await commissions.countBy({ appointment: { id: appointment.id } }),
        ).toBe(1);
        expect(
            await appointments.findOneByOrFail({ id: appointment.id }),
        ).toEqual(
            expect.objectContaining({ status: AppointmentStatus.Completed }),
        );
        await formulas.delete({ appointment: { id: appointment.id } });
        await commissions.delete({ appointment: { id: appointment.id } });
    });

    it('serializes cancellation against finalization into one terminal outcome', async () => {
        const users = dataSource.getRepository(User);
        const services = dataSource.getRepository(Service);
        const appointments = dataSource.getRepository(Appointment);
        const commissions = dataSource.getRepository(Commission);
        const formulas = dataSource.getRepository(Formula);
        const [client, owner] = await users.save([
            {
                ...userFixture(
                    'terminal-race-client@example.invalid',
                    Role.Client,
                ),
                receiveNotifications: false,
            },
            {
                ...userFixture(
                    'terminal-race-owner@example.invalid',
                    Role.Admin,
                ),
                receiveNotifications: false,
            },
        ]);
        const salonService = await services.save({
            name: 'Terminal race service',
            description: 'Isolated PostgreSQL terminal-state fixture',
            duration: 60,
            price: 100,
            priceType: PriceType.Fixed,
            commissionPercent: 10,
            isActive: true,
            onlineBooking: true,
        });
        const { appointmentService } = createLifecycleService(dataSource);
        const appointment = await appointmentService.create(
            bookingInput(
                client,
                owner,
                salonService,
                new Date(Date.now() + 17 * 24 * 60 * 60 * 1000),
            ),
            owner,
        );

        const attempts = await Promise.allSettled([
            appointmentService.finalizeAppointment(
                appointment.id,
                {
                    paymentMethod: PaymentMethod.Cash,
                    paidAmountCents: 10000,
                    formula: 'Formuła wyścigu terminalnego',
                },
                owner,
            ),
            appointmentService.cancel(appointment.id, owner),
        ]);

        expect(
            attempts.filter(({ status }) => status === 'fulfilled'),
        ).toHaveLength(1);
        const rejected = attempts.filter(({ status }) => status === 'rejected');
        expect(rejected).toHaveLength(1);
        expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(
            BadRequestException,
        );

        const stored = await appointments.findOneByOrFail({
            id: appointment.id,
        });
        expect([
            AppointmentStatus.Completed,
            AppointmentStatus.Cancelled,
        ]).toContain(stored.status);
        const expectedCheckoutRows =
            stored.status === AppointmentStatus.Completed ? 1 : 0;
        expect(
            await formulas.countBy({ appointment: { id: appointment.id } }),
        ).toBe(expectedCheckoutRows);
        expect(
            await commissions.countBy({ appointment: { id: appointment.id } }),
        ).toBe(expectedCheckoutRows);

        await formulas.delete({ appointment: { id: appointment.id } });
        await commissions.delete({ appointment: { id: appointment.id } });
    });

    it('backfills legacy channel choices and keeps safe defaults for new users', async () => {
        const migration =
            new SeparateOperationalNotificationPreferences1762570000000();
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        try {
            await migration.down(queryRunner);
            await queryRunner.query(`
                UPDATE "users"
                SET
                    "receiveNotifications" = true,
                    "smsConsent" = false,
                    "whatsappConsent" = true,
                    "emailConsent" = false
                WHERE "email" = 'first-client@example.invalid'
            `);
            await migration.up(queryRunner);
        } finally {
            await queryRunner.release();
        }

        const [legacy] = (await dataSource.query(`
            SELECT "notifySms", "notifyWhatsapp", "notifyEmail"
            FROM "users"
            WHERE "email" = 'first-client@example.invalid'
        `)) as Array<{
            notifySms: boolean;
            notifyWhatsapp: boolean;
            notifyEmail: boolean;
        }>;
        expect(legacy).toEqual({
            notifySms: false,
            notifyWhatsapp: true,
            notifyEmail: false,
        });

        const created = await dataSource.getRepository(User).save({
            email: 'new-defaults@example.invalid',
            password: 'test-only-password',
            name: 'New defaults',
            role: Role.Client,
            phone: '+48000000001',
            receiveNotifications: true,
            commissionBase: 0,
        });
        expect(created).toEqual(
            expect.objectContaining({
                notifySms: false,
                notifyWhatsapp: false,
                notifyEmail: true,
                smsConsent: false,
                whatsappConsent: false,
                emailConsent: false,
            }),
        );
    });

    it('can roll the reminder retry migration down and up', async () => {
        const migration = new AddReminderRetryState1762590000000();
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        try {
            await migration.down(queryRunner);
            expect(
                await queryRunner.hasColumn(
                    'appointments',
                    'reminderAttemptCount',
                ),
            ).toBe(false);
            expect(
                await queryRunner.hasColumn(
                    'appointments',
                    'reminderLastAttemptAt',
                ),
            ).toBe(false);

            await migration.up(queryRunner);
            expect(
                await queryRunner.hasColumn(
                    'appointments',
                    'reminderAttemptCount',
                ),
            ).toBe(true);
            expect(
                await queryRunner.hasColumn(
                    'appointments',
                    'reminderLastAttemptAt',
                ),
            ).toBe(true);
        } finally {
            await queryRunner.release();
        }
    });

    it('allows only one concurrent worker to claim and send a reminder', async () => {
        const appointments = dataSource.getRepository(Appointment);
        await appointments.createQueryBuilder().delete().execute();
        const users = dataSource.getRepository(User);
        const services = dataSource.getRepository(Service);
        const [client, employee] = await users.save([
            userFixture('reminder-client@example.invalid', Role.Client),
            userFixture('reminder-owner@example.invalid', Role.Admin),
        ]);
        client.notifyEmail = true;
        client.notifySms = false;
        await users.save(client);
        const salonService = await services.save({
            name: 'Reminder concurrency service',
            description: 'Isolated PostgreSQL test fixture',
            duration: 60,
            price: 100,
            priceType: PriceType.Fixed,
            isActive: true,
            onlineBooking: true,
        });
        const appointment = await appointments.save({
            clientId: client.id,
            employeeId: employee.id,
            serviceId: salonService.id,
            startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
            endTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
            status: AppointmentStatus.Confirmed,
            reminderSent: false,
        });
        const send = jest.fn().mockResolvedValue(undefined);
        const reminderService = new AutomaticReminderService(
            appointments,
            {
                findOne: jest.fn().mockResolvedValue({
                    type: TemplateType.AppointmentReminder,
                    channel: MessageChannel.Email,
                    subject: 'Reminder',
                    content: 'Appointment {{date}} {{time}}',
                    isDefault: true,
                    isActive: true,
                }),
            } as unknown as Repository<MessageTemplate>,
            {
                find: jest.fn().mockResolvedValue([
                    {
                        id: 1,
                        active: true,
                        timingHours: 24,
                        preferredChannel: ReminderChannel.Email,
                    },
                ]),
            } as unknown as Repository<ReminderSettings>,
            {} as SmsService,
            { send } as unknown as EmailsService,
            new ConfigService({ REMINDER_RETRY_MINUTES: '15' }),
        );

        await Promise.all([
            reminderService.sendAppointmentReminders(),
            reminderService.sendAppointmentReminders(),
        ]);

        const stored = await appointments.findOneByOrFail({
            id: appointment.id,
        });
        expect(send).toHaveBeenCalledTimes(1);
        expect(stored.reminderAttemptCount).toBe(1);
        expect(stored.reminderLastAttemptAt).toBeInstanceOf(Date);
        expect(stored.reminderSent).toBe(true);
        expect(stored.reminderSentAt).toBeInstanceOf(Date);
    });

    it('selects only the other side last message for actionable notifications', async () => {
        const users = dataSource.getRepository(User);
        const services = dataSource.getRepository(Service);
        const appointments = dataSource.getRepository(Appointment);
        const messages = dataSource.getRepository(AppointmentMessage);
        await appointments.createQueryBuilder().delete().execute();
        const [client, employee] = await users.save([
            userFixture('message-client@example.invalid', Role.Client),
            userFixture('message-owner@example.invalid', Role.Admin),
        ]);
        const salonService = await services.save({
            name: 'Message notification service',
            description: 'Isolated PostgreSQL test fixture',
            duration: 60,
            price: 100,
            priceType: PriceType.Fixed,
            isActive: true,
            onlineBooking: true,
        });
        const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const [clientReplied, salonWroteLast] = await appointments.save([
            {
                clientId: client.id,
                employeeId: employee.id,
                serviceId: salonService.id,
                startTime,
                endTime: new Date(startTime.getTime() + 60 * 60 * 1000),
                status: AppointmentStatus.Confirmed,
            },
            {
                clientId: client.id,
                employeeId: employee.id,
                serviceId: salonService.id,
                startTime: new Date(startTime.getTime() + 2 * 60 * 60 * 1000),
                endTime: new Date(startTime.getTime() + 3 * 60 * 60 * 1000),
                status: AppointmentStatus.Confirmed,
            },
        ]);
        const tiedCreatedAt = new Date('2026-09-08T09:00:00.000Z');
        await messages.save([
            {
                appointmentId: clientReplied.id,
                authorId: employee.id,
                authorRole: Role.Admin,
                body: 'Salon wrote first',
                createdAt: tiedCreatedAt,
            },
            {
                appointmentId: clientReplied.id,
                authorId: client.id,
                authorRole: Role.Client,
                body: 'Client replied at the same timestamp',
                createdAt: tiedCreatedAt,
            },
            {
                appointmentId: salonWroteLast.id,
                authorId: employee.id,
                authorRole: Role.Admin,
                body: 'Salon awaits a reply',
                createdAt: new Date('2026-09-08T09:05:00.000Z'),
            },
        ]);
        const controller = new NotificationsController(appointments, messages);

        const notifications = await controller.getNotifications({
            userId: client.id,
            role: Role.Client,
        });
        const messageNotifications = notifications.filter(
            (item) => item.type === 'appointment_message_action',
        );

        expect(messageNotifications).toHaveLength(1);
        expect(messageNotifications[0]).toEqual(
            expect.objectContaining({
                appointmentId: salonWroteLast.id,
                actionHref: `/visits?visitId=${salonWroteLast.id}`,
            }),
        );
        await expect(
            controller.getActionableCount({
                userId: employee.id,
                role: Role.Admin,
            }),
        ).resolves.toEqual({ count: 1 });
    });

    it('keeps one client journey connected from online booking through checkout and cancellation', async () => {
        const users = dataSource.getRepository(User);
        const services = dataSource.getRepository(Service);
        const products = dataSource.getRepository(Product);
        const appointments = dataSource.getRepository(Appointment);
        const messages = dataSource.getRepository(AppointmentMessage);
        const commissions = dataSource.getRepository(Commission);
        const formulas = dataSource.getRepository(Formula);
        const sales = dataSource.getRepository(WarehouseSale);
        const usages = dataSource.getRepository(WarehouseUsage);
        const [client, owner] = await users.save([
            {
                ...userFixture('lifecycle-client@example.invalid', Role.Client),
                receiveNotifications: false,
                firstName: 'Testowa',
                lastName: 'Klientka',
            },
            {
                ...userFixture('lifecycle-owner@example.invalid', Role.Admin),
                receiveNotifications: false,
                commissionBase: 5,
            },
        ]);
        const [primaryService, additionalService] = await services.save([
            {
                name: 'Lifecycle primary service',
                description: 'Isolated PostgreSQL lifecycle fixture',
                duration: 60,
                price: 100,
                priceType: PriceType.Fixed,
                commissionPercent: 10,
                isActive: true,
                onlineBooking: true,
            },
            {
                name: 'Lifecycle additional service',
                description: 'Isolated PostgreSQL lifecycle fixture',
                duration: 20,
                price: 40,
                priceType: PriceType.Fixed,
                commissionPercent: 10,
                isActive: true,
                onlineBooking: true,
            },
        ]);
        const [retailProduct, treatmentMaterial] = await products.save([
            {
                name: 'Lifecycle retail product',
                productType: ProductType.Product,
                unitPrice: 30,
                vatRate: 23,
                purchasePrice: 10,
                stock: 5,
                unit: 'op.',
                isActive: true,
                trackStock: true,
            },
            {
                name: 'Lifecycle treatment material',
                productType: ProductType.Supply,
                unitPrice: 20,
                vatRate: 23,
                purchasePrice: 8,
                stock: 10,
                unit: 'g',
                isActive: true,
                trackStock: true,
            },
        ]);
        const { appointmentService, retailService } =
            createLifecycleService(dataSource);
        const firstStart = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

        const booked = await appointmentService.create(
            bookingInput(client, owner, primaryService, firstStart),
            client,
        );
        expect(booked.status).toBe(AppointmentStatus.OnlinePending);

        const confirmed = await appointmentService.updateStatus(
            booked.id,
            AppointmentStatus.Confirmed,
            owner,
        );
        expect(confirmed?.status).toBe(AppointmentStatus.Confirmed);

        await appointmentService.addMessage(
            booked.id,
            { userId: client.id, role: Role.Client },
            'Czy mogę przyjść trochę później?',
        );
        await appointmentService.addMessage(
            booked.id,
            { userId: owner.id, role: Role.Admin },
            'Tak, proponuję nowy termin.',
        );
        expect(
            await appointmentService.listMessages(booked.id, {
                userId: client.id,
                role: Role.Client,
            }),
        ).toEqual([
            expect.objectContaining({
                appointmentId: booked.id,
                authorId: client.id,
                body: 'Czy mogę przyjść trochę później?',
            }),
            expect.objectContaining({
                appointmentId: booked.id,
                authorId: owner.id,
                body: 'Tak, proponuję nowy termin.',
            }),
        ]);

        const movedStart = new Date(firstStart.getTime() + 24 * 60 * 60 * 1000);
        const proposed = await appointmentService.reschedule(
            booked.id,
            movedStart,
            undefined,
            undefined,
            false,
            owner,
        );
        expect(proposed?.status).toBe(AppointmentStatus.RescheduledPending);
        const accepted = await appointmentService.acceptReschedule(
            booked.id,
            client,
        );
        expect(accepted).toEqual(
            expect.objectContaining({
                id: booked.id,
                status: AppointmentStatus.Confirmed,
                startTime: movedStart,
                reschedulePreviousStartTime: null,
            }),
        );

        const finalized = await appointmentService.finalizeAppointment(
            booked.id,
            {
                paymentMethod: PaymentMethod.Card,
                servicePriceCents: 10000,
                paidAmountCents: 18000,
                tipAmountCents: 1000,
                discountCents: 500,
                products: [
                    {
                        productId: retailProduct.id,
                        quantity: 1,
                        unitPriceCents: 3000,
                    },
                ],
                usageMaterials: [
                    {
                        productId: treatmentMaterial.id,
                        quantity: 2,
                        unit: 'g',
                    },
                ],
                additionalServices: [
                    {
                        serviceId: additionalService.id,
                        priceCents: 4000,
                        discountCents: 500,
                    },
                ],
                note: 'Notatka tylko dla salonu',
                staffRecommendations: 'Zalecenia widoczne dla klientki',
                formula: 'Formuła testowa 1:1',
            },
            owner,
        );

        expect(finalized).toEqual(
            expect.objectContaining({
                id: booked.id,
                status: AppointmentStatus.Completed,
                paidAmount: '180.00',
                tipAmount: '10.00',
                discount: '5.00',
                internalNote: 'Notatka tylko dla salonu',
                staffRecommendations: 'Zalecenia widoczne dla klientki',
                extraServices: [
                    {
                        serviceId: additionalService.id,
                        name: additionalService.name,
                        priceCents: 4000,
                        discountCents: 500,
                    },
                ],
            }),
        );
        const clientView = await new AppointmentsController(
            appointmentService,
        ).findMine({ userId: client.id });
        const completedClientVisit = clientView.find(
            (item) => item.id === booked.id,
        );
        expect(completedClientVisit).toEqual(
            expect.objectContaining({
                status: AppointmentStatus.Completed,
                staffRecommendations: 'Zalecenia widoczne dla klientki',
            }),
        );
        expect(completedClientVisit).not.toHaveProperty('internalNote');
        expect(completedClientVisit).not.toHaveProperty('paidAmount');
        expect(completedClientVisit).not.toHaveProperty('tipAmount');
        expect(completedClientVisit).not.toHaveProperty('discount');
        expect(
            await products.findOneByOrFail({ id: retailProduct.id }),
        ).toEqual(expect.objectContaining({ stock: 4 }));
        expect(
            await products.findOneByOrFail({ id: treatmentMaterial.id }),
        ).toEqual(expect.objectContaining({ stock: 8 }));
        expect(
            await commissions.findOneOrFail({
                where: { appointment: { id: booked.id } },
            }),
        ).toEqual(expect.objectContaining({ amount: 13.5, percent: 10 }));
        expect(
            await commissions.findOneOrFail({
                where: { product: { id: retailProduct.id } },
            }),
        ).toEqual(
            expect.objectContaining({
                appointment: null,
                amount: 1.5,
                percent: 5,
            }),
        );
        expect(
            await formulas.findOneOrFail({
                where: { appointment: { id: booked.id } },
            }),
        ).toEqual(
            expect.objectContaining({ description: 'Formuła testowa 1:1' }),
        );
        expect(
            await sales.findOneOrFail({ where: { appointmentId: booked.id } }),
        ).toEqual(
            expect.objectContaining({
                clientId: client.id,
                totalGross: 30,
            }),
        );
        expect(
            await usages.findOneOrFail({ where: { appointmentId: booked.id } }),
        ).toEqual(expect.objectContaining({ clientId: client.id }));
        await expect(
            retailService.getUsageHistoryForClient(client.id),
        ).resolves.toEqual([
            expect.objectContaining({ appointmentId: booked.id }),
        ]);
        await usages.update({ appointmentId: booked.id }, { clientId: null });
        await expect(
            retailService.getUsageHistoryForClient(client.id),
        ).resolves.toEqual([
            expect.objectContaining({ appointmentId: booked.id }),
        ]);

        const storedMessages = await messages.findBy({
            appointmentId: booked.id,
        });
        expect(storedMessages).toHaveLength(2);
        const storedAppointment = await appointments.findOneByOrFail({
            id: booked.id,
        });
        expect(storedAppointment.status).toBe(AppointmentStatus.Completed);

        const cancelledBooking = await appointmentService.create(
            bookingInput(
                client,
                owner,
                primaryService,
                new Date(firstStart.getTime() + 3 * 24 * 60 * 60 * 1000),
            ),
            client,
        );
        await appointmentService.requestCancellation(
            cancelledBooking.id,
            client,
            'Rezygnuję z drugiego terminu',
        );
        const cancelled = await appointmentService.cancel(
            cancelledBooking.id,
            owner,
        );
        expect(cancelled?.status).toBe(AppointmentStatus.Cancelled);
    });

    it('plans safely and preserves variant foreign keys across repeated service imports', async () => {
        const users = dataSource.getRepository(User);
        const categories = dataSource.getRepository(ServiceCategory);
        const services = dataSource.getRepository(Service);
        const variants = dataSource.getRepository(ServiceVariant);
        const appointments = dataSource.getRepository(Appointment);
        const employeeServices = dataSource.getRepository(EmployeeService);
        const category = await categories.save({
            name: 'Import Test Category',
            sortOrder: 900,
            isActive: true,
        });
        const service = await services.save({
            name: 'Import Stable',
            description: 'before import',
            duration: 60,
            price: 100,
            priceType: PriceType.Fixed,
            isActive: true,
            onlineBooking: true,
            categoryId: category.id,
        });
        const originalVariant = await variants.save({
            serviceId: service.id,
            name: 'Długie',
            duration: 60,
            price: 100,
            priceType: PriceType.Fixed,
            sortOrder: 0,
            isActive: true,
        });
        const [client, employee] = await users.save([
            userFixture('import-client@example.invalid', Role.Client),
            userFixture('import-owner@example.invalid', Role.Admin),
        ]);
        const appointment = await appointments.save({
            clientId: client.id,
            employeeId: employee.id,
            serviceId: service.id,
            serviceVariantId: originalVariant.id,
            startTime: new Date('2026-10-01T10:00:00Z'),
            endTime: new Date('2026-10-01T11:00:00Z'),
            status: AppointmentStatus.Confirmed,
        });
        const assignment = await employeeServices.save({
            employeeId: employee.id,
            serviceId: service.id,
            serviceVariantId: originalVariant.id,
            isActive: true,
        });

        const csv = [
            'Import Test Category;;;;',
            'Usługa;Cena;Cena maksymalna;Czas;Opis',
            'Import Stable - Długie;210;;90;po imporcie',
            'Import Stable - Krótkie;180;;60;po imporcie',
        ].join('\n');

        await withServiceImportCsv(csv, async (csvPath) => {
            await runServiceImport(csvPath, false);
            expect(
                (await services.findOneByOrFail({ id: service.id })).price,
            ).toBe(100);

            await runServiceImport(csvPath, true);
            const firstIds = (
                await variants.findBy({ serviceId: service.id })
            ).map((variant) => variant.id);
            await runServiceImport(csvPath, true);
            const secondIds = (
                await variants.findBy({ serviceId: service.id })
            ).map((variant) => variant.id);

            expect(secondIds.sort()).toEqual(firstIds.sort());
        });

        expect(
            (await appointments.findOneByOrFail({ id: appointment.id }))
                .serviceVariantId,
        ).toBe(originalVariant.id);
        expect(
            (await employeeServices.findOneByOrFail({ id: assignment.id }))
                .serviceVariantId,
        ).toBe(originalVariant.id);
        expect(
            (await variants.findOneByOrFail({ id: originalVariant.id })).price,
        ).toBe(210);

        const blocker = await services.save({
            name: 'Import Blocker',
            description: 'before import',
            duration: 30,
            price: 50,
            priceType: PriceType.Fixed,
            isActive: true,
            onlineBooking: true,
            categoryId: category.id,
        });
        await variants.save({
            serviceId: blocker.id,
            name: 'Standard',
            duration: 30,
            price: 50,
            priceType: PriceType.Fixed,
            sortOrder: 0,
            isActive: true,
        });
        const conflictingCsv = [
            'Import Test Category;;;;',
            'Usługa;Cena;Cena maksymalna;Czas;Opis',
            'Import Stable - Długie;999;;90;nie zapisuj',
            'Import Blocker - Standard;60;;30;duplikat 1',
            'Import Blocker - standard;70;;30;duplikat 2',
        ].join('\n');

        await withServiceImportCsv(conflictingCsv, async (csvPath) => {
            await expect(runServiceImport(csvPath, true)).rejects.toThrow(
                'Import blocked by conflicts',
            );
        });
        expect((await services.findOneByOrFail({ id: service.id })).price).toBe(
            180,
        );
    });

    it('keeps live product stock unless replacement is explicitly enabled', async () => {
        const products = dataSource.getRepository(Product);
        const product = await products.save({
            name: 'Import Color',
            brand: 'Import Brand',
            sku: 'IMPORT-1',
            barcode: '5900000000001',
            productType: ProductType.Supply,
            unitPrice: 10,
            purchasePrice: 5,
            stock: 42,
            unit: 'ml',
            isActive: true,
            trackStock: true,
        });
        const csv = [
            'Produkt;Producent;Cena netto (zł);Stawka VAT;Cena brutto (zł);Ostatnia cena zakupu netto;Stan magazynowy w opakowaniach;Stan magazynowy w jednostce zużycia;Rodzaj produktu;Jednostka zużycia;;Opis;Kod wewnętrzny (SKU);Kod kreskowy',
            'Import Color;Import Brand;18,52;8%;20;8;1;60;Materiał;ml;;po imporcie;IMPORT-1;5900000000001',
        ].join('\n');

        await withImportCsv('products.csv', csv, async (csvPath) => {
            await runProductImport(csvPath, false, false);
            expect(
                (await products.findOneByOrFail({ id: product.id })).unitPrice,
            ).toBe(10);

            await runProductImport(csvPath, true, false);
            let refreshed = await products.findOneByOrFail({ id: product.id });
            expect(refreshed.unitPrice).toBe(20);
            expect(refreshed.vatRate).toBe(8);
            expect(refreshed.stock).toBe(42);

            await runProductImport(csvPath, true, true);
            refreshed = await products.findOneByOrFail({ id: product.id });
            expect(refreshed.stock).toBe(60);
        });
    });

    it('blocks product values that would be silently truncated', async () => {
        const csv = [
            'Produkt;Producent;Cena netto (zł);Stawka VAT;Cena brutto (zł);Ostatnia cena zakupu netto;Stan magazynowy w opakowaniach;Stan magazynowy w jednostce zużycia;Rodzaj produktu;Jednostka zużycia;;Opis;Kod wewnętrzny (SKU);Kod kreskowy',
            `${'A'.repeat(201)};Import Brand;;23%;20;8;0;10;Materiał;ml;;opis;IMPORT-LONG;`,
        ].join('\n');

        await withImportCsv('products.csv', csv, async (csvPath) => {
            await expect(
                runProductImport(csvPath, false, false),
            ).rejects.toThrow('product name exceeds 200 characters');
        });
    });
});

async function withServiceImportCsv(
    content: string,
    callback: (csvPath: string) => Promise<void>,
): Promise<void> {
    return withImportCsv('services.csv', content, callback);
}

async function withImportCsv(
    filename: string,
    content: string,
    callback: (csvPath: string) => Promise<void>,
): Promise<void> {
    const directory = await mkdtemp(join(tmpdir(), 'salonbw-import-'));
    const csvPath = join(directory, filename);
    try {
        await writeFile(csvPath, content, 'utf8');
        await callback(csvPath);
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
}

async function runProductImport(
    csvPath: string,
    apply: boolean,
    replaceStock: boolean,
): Promise<void> {
    const backendRoot = join(__dirname, '..');
    await execFileAsync(
        join(backendRoot, 'node_modules/.bin/ts-node'),
        ['--transpile-only', 'scripts/import-products.ts'],
        {
            cwd: backendRoot,
            env: {
                ...process.env,
                DATABASE_URL: testDatabaseUrl,
                IMPORT_PRODUCTS_CSV: csvPath,
                IMPORT_PRODUCTS_APPLY: apply ? '1' : '',
                IMPORT_PRODUCTS_REPLACE_STOCK: replaceStock ? '1' : '',
            },
        },
    );
}

async function runServiceImport(
    csvPath: string,
    apply: boolean,
): Promise<void> {
    const backendRoot = join(__dirname, '..');
    await execFileAsync(
        join(backendRoot, 'node_modules/.bin/ts-node'),
        ['--transpile-only', 'scripts/import-services.ts'],
        {
            cwd: backendRoot,
            env: {
                ...process.env,
                DATABASE_URL: testDatabaseUrl,
                IMPORT_SERVICES_CSV: csvPath,
                IMPORT_SERVICES_APPLY: apply ? '1' : '',
            },
        },
    );
}

function userFixture(email: string, role: Role): Partial<User> {
    return {
        email,
        password: 'test-only-password',
        name: email,
        role,
        phone: '+48000000000',
        receiveNotifications: true,
        whatsappConsent: true,
        commissionBase: 0,
    };
}

function bookingInput(
    client: User,
    employee: User,
    salonService: Service,
    startTime: Date,
): Partial<Appointment> {
    return {
        client: { id: client.id } as User,
        employee: { id: employee.id } as User,
        service: { id: salonService.id } as Service,
        startTime: new Date(startTime),
    };
}

function createService(dataSource: DataSource): AppointmentsService {
    const resolved = Promise.resolve();
    return new AppointmentsService(
        dataSource.getRepository(Appointment),
        dataSource.getRepository(Service),
        dataSource.getRepository(ServiceVariant),
        dataSource.getRepository(ServiceRecipeItem),
        dataSource.getRepository(User),
        dataSource.getRepository(CalendarSettings),
        dataSource.getRepository(AppointmentMessage),
        {} as never,
        { logAction: () => resolved } as never,
        {
            sendBookingConfirmation: () => resolved,
            sendNewBookingToEmployee: () => resolved,
            sendRescheduleNotification: () => resolved,
        } as never,
    );
}

function createLifecycleService(dataSource: DataSource): {
    appointmentService: AppointmentsService;
    retailService: RetailService;
} {
    const resolved = Promise.resolve();
    const logs = { logAction: () => resolved } as never;
    const commissions = new CommissionsService(
        dataSource.getRepository(Commission),
        dataSource.getRepository(CommissionRule),
        logs,
    );
    const config = new ConfigService({
        POS_ENABLED: 'true',
        POS_REQUIRE_COMMISSION: 'true',
    });
    const retail = new RetailService(
        dataSource.getRepository(Product),
        dataSource.getRepository(User),
        dataSource.getRepository(Appointment),
        dataSource.getRepository(WarehouseSale),
        dataSource.getRepository(WarehouseSaleItem),
        dataSource.getRepository(WarehouseUsage),
        dataSource.getRepository(WarehouseUsageItem),
        commissions,
        logs,
        config,
        dataSource,
        new PricingService(),
    );
    const appointmentService = new AppointmentsService(
        dataSource.getRepository(Appointment),
        dataSource.getRepository(Service),
        dataSource.getRepository(ServiceVariant),
        dataSource.getRepository(ServiceRecipeItem),
        dataSource.getRepository(User),
        dataSource.getRepository(CalendarSettings),
        dataSource.getRepository(AppointmentMessage),
        commissions,
        logs,
        {
            sendBookingConfirmation: () => resolved,
            sendNewBookingToEmployee: () => resolved,
            sendRescheduleNotification: () => resolved,
            sendFollowUp: () => resolved,
        } as never,
        undefined,
        retail,
    );
    return { appointmentService, retailService: retail };
}
