import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import {
    Appointment,
    AppointmentStatus,
    PaymentMethod,
} from '../appointments/appointment.entity';
import { User } from '../users/user.entity';
import { Role } from '../users/role.enum';
import { Service } from '../services/service.entity';
import { ServiceCategory } from '../services/entities/service-category.entity';
import { EmployeeService } from '../services/entities/employee-service.entity';
import { Timetable } from '../timetables/entities/timetable.entity';
import { DayOfWeek } from '../timetables/entities/timetable-slot.entity';

interface EventQueryParams {
    start: Date;
    end: Date;
    userIds: number[];
}

interface SchedulesQueryParams {
    date: Date;
    period: string;
    employeeIds: number[];
}

@Injectable()
export class VersumCompatService {
    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentsRepository: Repository<Appointment>,
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        @InjectRepository(Service)
        private readonly servicesRepository: Repository<Service>,
        @InjectRepository(ServiceCategory)
        private readonly serviceCategoriesRepository: Repository<ServiceCategory>,
        @InjectRepository(EmployeeService)
        private readonly employeeServicesRepository: Repository<EmployeeService>,
        @InjectRepository(Timetable)
        private readonly timetablesRepository: Repository<Timetable>,
    ) {}

    async getEvents(params: EventQueryParams) {
        const { start, end, userIds } = params;

        const qb = this.appointmentsRepository
            .createQueryBuilder('appointment')
            .leftJoinAndSelect('appointment.client', 'client')
            .leftJoinAndSelect('appointment.employee', 'employee')
            .leftJoinAndSelect('appointment.service', 'service')
            .leftJoinAndSelect('appointment.serviceVariant', 'serviceVariant')
            .where('appointment.startTime < :end', { end })
            .andWhere('appointment.endTime > :start', { start })
            .andWhere('appointment.status != :cancelled', {
                cancelled: AppointmentStatus.Cancelled,
            })
            .orderBy('appointment.startTime', 'ASC');

        if (userIds.length > 0) {
            qb.andWhere('appointment.employeeId IN (:...userIds)', { userIds });
        }

        const appointments = await qb.getMany();
        return appointments.map((appointment) => this.mapCalendarEvent(appointment));
    }

    async getEventScreenData(id: number) {
        const appointment = await this.appointmentsRepository.findOne({
            where: { id },
            relations: ['client', 'employee', 'service', 'serviceVariant'],
        });

        if (!appointment) {
            throw new NotFoundException('Event not found');
        }

        return {
            events: [this.mapScreenDataEvent(appointment)],
            formulas: null,
            prepayment_balance: 0,
            overpayment_balance: 0,
        };
    }

    async finalizeEvent(id: number, user: User, payload: Record<string, unknown>) {
        const appointment = await this.appointmentsRepository.findOne({
            where: { id },
            relations: ['client', 'employee', 'service', 'serviceVariant'],
        });

        if (!appointment) {
            throw new NotFoundException('Event not found');
        }

        const didHappen = !this.isTruthy(payload?.not_an_appointment);

        appointment.status = didHappen
            ? AppointmentStatus.Completed
            : AppointmentStatus.NoShow;
        appointment.finalizedAt = new Date();
        appointment.finalizedBy = user;

        if (didHappen) {
            const paymentMethod = this.pickPaymentMethod(payload);
            appointment.paymentMethod = paymentMethod;
        } else {
            appointment.paymentMethod = undefined;
            appointment.paidAmount = undefined;
            appointment.tipAmount = undefined;
            appointment.discount = undefined;
        }

        await this.appointmentsRepository.save(appointment);

        return {
            success: true,
            event: this.mapScreenDataEvent(appointment),
        };
    }

    async getSchedules(params: SchedulesQueryParams) {
        const { date, period, employeeIds } = params;

        const ids =
            employeeIds.length > 0 ? employeeIds : await this.getDefaultEmployeeIds();

        const range = this.getScheduleRange(date, period);
        const result: Record<string, { employee: Record<string, unknown>; resource: Record<string, never> }> = {};

        for (const day of range.days) {
            const dateKey = this.toDateKey(day);
            const employee: Record<string, unknown> = {};

            for (const employeeId of ids) {
                employee[String(employeeId)] = await this.getEmployeeDaySchedule(
                    employeeId,
                    day,
                );
            }

            result[dateKey] = {
                employee,
                resource: {},
            };
        }

        return result;
    }

    async graphql(payload: {
        operationName?: string;
        variables?: Record<string, unknown>;
    }) {
        const operationName = payload.operationName ?? '';

        switch (operationName) {
            case 'GetNetGrossTranslationType':
                return {
                    data: {
                        viewer: {
                            branch: {
                                netGrossTranslationType: 'STANDARD',
                                __typename: 'Branch',
                            },
                            __typename: 'Viewer',
                        },
                    },
                };
            case 'GetNotificationCenterUnreadCount':
                return {
                    data: {
                        notificationCenterUnreadCount: {
                            notifications: 0,
                            __typename: 'NotificationCenterUnreadCountType',
                        },
                    },
                };
            case 'GetNotificationCenterPushNotifications':
                return {
                    data: {
                        notificationCenterPushNotifications: {
                            items: [],
                            __typename:
                                'NotificationCenterPushNotificationList',
                        },
                    },
                };
            case 'GetNotificationCenterNotifications':
                return {
                    data: {
                        notificationCenterNotifications: {
                            items: [],
                            __typename: 'NotificationCenterNotificationList',
                        },
                    },
                };
            case 'GetNotificationCenterNotification':
                return {
                    data: {
                        notificationCenterNotification: null,
                    },
                };
            case 'ReadNotificationCenterPushNotification':
                return {
                    data: {
                        readNotificationCenterPushNotification: true,
                    },
                };
            case 'ReadNotificationCenterNotification':
                return {
                    data: {
                        readNotificationCenterNotification: true,
                    },
                };
            case 'GetViewer':
                return {
                    data: {
                        viewer: await this.getGraphqlViewer(),
                    },
                };
            case 'GetEmployees':
                return {
                    data: {
                        employees: await this.getGraphqlEmployees(),
                    },
                };
            case 'GetServiceCategories':
                return {
                    data: {
                        serviceCategories: await this.getGraphqlServiceCategories(),
                    },
                };
            case 'GetServices':
                return {
                    data: {
                        services: await this.getGraphqlServicesLegacy(
                            payload.variables,
                        ),
                    },
                };
            case 'GetAllServices':
                return {
                    data: {
                        services: await this.getGraphqlServices(payload.variables),
                    },
                };
            default:
                return { data: {} };
        }
    }

    getTrackNewEvents() {
        return { events: [] };
    }

    private mapCalendarEvent(appointment: Appointment) {
        const serviceRefId = appointment.serviceVariantId ?? appointment.serviceId;
        const durationMinutes = this.diffMinutes(
            appointment.startTime,
            appointment.endTime,
        );

        return {
            allDay: false,
            start: this.toWarsawIso(appointment.startTime),
            end: this.toWarsawIso(appointment.endTime),
            full_start: this.toWarsawIso(appointment.startTime),
            full_end: this.toWarsawIso(appointment.endTime),
            employee_start: this.toWarsawIso(appointment.startTime),
            employee_end: this.toWarsawIso(appointment.endTime),
            id: `${appointment.id}_${serviceRefId}`,
            event_id: appointment.id,
            groupId: appointment.id,
            customer_id: appointment.clientId,
            entities: [{ id: appointment.employeeId, type: 'employee' }],
            events_services: [
                {
                    id: serviceRefId,
                    started_at: this.toWarsawIso(appointment.startTime),
                    employee_ids: [appointment.employeeId],
                    resource_ids: [],
                    duration: durationMinutes,
                    duration_before: 0,
                    duration_after: 0,
                    employee_started_at: this.toWarsawIso(appointment.startTime),
                    employee_duration: durationMinutes,
                    break_started_at: null,
                    break_duration: 0,
                    break_offset: 0,
                    full_name:
                        appointment.serviceVariant?.name ??
                        appointment.service?.name ??
                        'Wizyta',
                },
            ],
            block_events_services_ids: [serviceRefId],
            finalized: appointment.status === AppointmentStatus.Completed,
            canceled: appointment.status === AppointmentStatus.Cancelled,
            deleted_at: null,
            editable: ![
                AppointmentStatus.Completed,
                AppointmentStatus.Cancelled,
                AppointmentStatus.NoShow,
            ].includes(appointment.status),
            updated_at: this.toWarsawIso(appointment.updatedAt),
            finalized_at: appointment.finalizedAt
                ? this.toWarsawIso(appointment.finalizedAt)
                : null,
            not_an_appointment: appointment.status === AppointmentStatus.NoShow,
            prepayment_id: null,
            prepayment_amount: 0,
            prepayment_amount_paid: 0,
            prepayment_status: null,
            prepayment_payment_method: null,
            prepayment_created_by_customer: false,
            group_id: appointment.id,
            breaks: [],
            tags: [],
            customer: {
                id: appointment.clientId,
                full_name: appointment.client?.name ?? '',
            },
            reserved_online: appointment.reservedOnline,
            created_at: this.toWarsawIso(appointment.createdAt),
            description: appointment.notes ?? '',
            info_from_customer: null,
            display_events_services: true,
            payment_method: this.toVersumPaymentMethod(appointment.paymentMethod),
            payment_method_name: this.paymentMethodLabel(appointment.paymentMethod),
            price: this.toNumber(appointment.paidAmount) || this.toNumber(appointment.service?.price) || 0,
            services_price_sum: this.toNumber(appointment.service?.price) || 0,
            payments: appointment.paidAmount
                ? [
                      {
                          payment_method: this.toVersumPaymentMethod(
                              appointment.paymentMethod,
                          ),
                          payment_method_name: this.paymentMethodLabel(
                              appointment.paymentMethod,
                          ),
                          price: this.toNumber(appointment.paidAmount),
                      },
                  ]
                : [],
            recurrence_group_id: null,
            recurrence_params: null,
        };
    }

    private mapScreenDataEvent(appointment: Appointment) {
        const serviceRefId = appointment.serviceVariantId ?? appointment.serviceId;
        const durationMinutes = this.diffMinutes(
            appointment.startTime,
            appointment.endTime,
        );
        const servicePrice = this.toNumber(appointment.service?.price) || 0;
        const paidAmount = this.toNumber(appointment.paidAmount) || servicePrice;

        return {
            id: appointment.id,
            pretty_id: `APT-${appointment.id}`,
            branch_id: 19581,
            customer_id: appointment.clientId,
            reminder_id: null,
            beginning: this.toWarsawIso(appointment.startTime),
            end: this.toWarsawIso(appointment.endTime),
            finalized: appointment.status === AppointmentStatus.Completed,
            canceled: appointment.status === AppointmentStatus.Cancelled,
            not_an_appointment: appointment.status === AppointmentStatus.NoShow,
            reserved_online: appointment.reservedOnline,
            info_from_customer: null,
            description: appointment.notes ?? null,
            version: 1,
            finalized_at: appointment.finalizedAt
                ? this.toWarsawIso(appointment.finalizedAt)
                : null,
            deleted_at: null,
            created_at: this.toWarsawIso(appointment.createdAt),
            updated_at: this.toWarsawIso(appointment.updatedAt),
            allday: false,
            allday_beginning: this.toWarsawIso(this.startOfDay(appointment.startTime)),
            allday_end: this.toWarsawIso(this.addDays(this.startOfDay(appointment.startTime), 1)),
            branch_category_path: '/settings/customer_panel/business_categories',
            is_booksy_possible: false,
            modified_by: appointment.finalizedBy?.id ?? appointment.employeeId,
            modified_by_type: 'Physical::User',
            status: this.statusLabel(appointment.status),
            payment_method: this.toVersumPaymentMethod(appointment.paymentMethod),
            beginning_date: this.toDateKey(appointment.startTime),
            end_date: this.toDateKey(appointment.endTime),
            reserved_duration: this.formatMinutes(durationMinutes),
            services_duration: this.formatMinutes(durationMinutes),
            services_price: this.formatPln(servicePrice),
            customer_name: appointment.client?.name ?? '',
            unreversed_customer_name: appointment.client?.name ?? '',
            customer_url: `/clients/${appointment.clientId}`,
            customer_phone_number: appointment.client?.phone ?? null,
            customer_phone_number_formatted: appointment.client?.phone ?? null,
            customer_email: appointment.client?.email ?? '',
            customer_sms_url: '',
            customer_email_url: '',
            customer_description: appointment.client?.description ?? '',
            customer_description_content_type: 'text/markdown',
            send_reminder: true,
            send_reminder_edition_locked: false,
            reminder_handled_by_booksy: false,
            booksy_origin: false,
            price: paidAmount,
            price_pln: this.formatPln(paidAmount),
            last_update: this.formatLastUpdate(appointment.updatedAt),
            services: [
                {
                    id: appointment.serviceId,
                    service_id: appointment.serviceId,
                    employee_ids: [appointment.employeeId],
                    random_employee: false,
                    employees: [
                        {
                            id: appointment.employeeId,
                            name: appointment.employee?.name ?? 'Pracownik',
                            initials: this.toInitials(appointment.employee?.name),
                            calendar_class_name: 'color10',
                        },
                    ],
                    resource_ids: [],
                    resources: [],
                    resource_recipes: [],
                    name:
                        appointment.serviceVariant?.name ??
                        appointment.service?.name ??
                        'Usługa',
                    price: this.formatPln(servicePrice),
                    paid: appointment.status === AppointmentStatus.Completed,
                    duration: this.formatMinutes(durationMinutes),
                    payment: paidAmount,
                    payment_pln: this.formatPln(paidAmount),
                    event_service_id: serviceRefId,
                    raw_price: servicePrice,
                    raw_price_max: null,
                    raw_duration: durationMinutes,
                    prepayment_amount: 0,
                    event_service_duration: durationMinutes,
                    event_service_duration_before: 0,
                    event_service_duration_after: 0,
                    event_service_break_offset: 0,
                    event_service_break_duration: 0,
                    started_at: this.toWarsawIso(appointment.startTime),
                    finished_at: this.toWarsawIso(appointment.endTime),
                    base_price: paidAmount,
                    discount: '',
                    vat_value: this.toNumber(appointment.service?.vatRate) ?? 23,
                },
            ],
            tags: [],
            payments: paidAmount
                ? [
                      {
                          price: paidAmount,
                          price_pln: this.formatPln(paidAmount),
                          payment_method: this.toVersumPaymentMethod(
                              appointment.paymentMethod,
                          ),
                          predefined: false,
                          gift_coupon: null,
                      },
                  ]
                : [],
            versions_url: `/events/${appointment.id}/versions`,
            has_sale: false,
            sale_price: null,
            sale_id: null,
            supply_use_id: null,
            editable: true,
            finalizable: ![
                AppointmentStatus.Completed,
                AppointmentStatus.Cancelled,
            ].includes(appointment.status),
            can_access_price: true,
            calendar_url: `/calendar?date=${this.toDateKey(
                appointment.startTime,
            )}&employees[]=${appointment.employeeId}&event=${appointment.id}`,
            can_view_in_calendar: true,
            can_restore_in_calendar: false,
            tss_receipt_issuing_available: false,
            tss_receipts: [],
            group_id: appointment.id,
            group_size: 1,
            group_payments: paidAmount
                ? [
                      {
                          price: paidAmount,
                          payment_method: this.toVersumPaymentMethod(
                              appointment.paymentMethod,
                          ),
                          predefined: false,
                      },
                  ]
                : [],
            group_tips: [],
            sold_gift_cards: [],
            sold_packages: [],
            prepayment_id: null,
            prepayment_amount: 0,
            prepayment_amount_paid: 0,
            prepayment_status: null,
            prepayment_real_status: null,
            prepayment_payment_method: null,
            prepayment_expiration_date_time: null,
            prepayment_paid_at: null,
            prepayment_created_at: null,
            prepayment_creator_type: null,
            prepayment_created_by_customer: false,
            prepayment_payments: [],
            recurrence_params: null,
            recurrence_group_id: null,
        };
    }

    private async getGraphqlServiceCategories() {
        const [categories, employeeServices] = await Promise.all([
            this.serviceCategoriesRepository.find({ order: { sortOrder: 'ASC' } }),
            this.employeeServicesRepository.find({ where: { isActive: true } }),
        ]);

        const employeesByCategory = new Map<number, Set<number>>();

        const services = await this.servicesRepository.find({
            where: { categoryId: In(categories.map((c) => c.id)) },
            select: ['id', 'categoryId'],
        });

        const categoryByService = new Map<number, number>();
        for (const service of services) {
            if (service.categoryId) {
                categoryByService.set(service.id, service.categoryId);
            }
        }

        for (const assignment of employeeServices) {
            const categoryId = categoryByService.get(assignment.serviceId);
            if (!categoryId) continue;
            if (!employeesByCategory.has(categoryId)) {
                employeesByCategory.set(categoryId, new Set());
            }
            employeesByCategory.get(categoryId)?.add(assignment.employeeId);
        }

        return categories.map((category) => ({
            name: category.name,
            id: category.id,
            ancestry: category.parentId ? String(category.parentId) : null,
            position: category.sortOrder,
            vat: 23,
            employees: [...(employeesByCategory.get(category.id) ?? new Set())].map(
                (id) => ({
                    id,
                    __typename: 'Employee',
                }),
            ),
            __typename: 'ServiceCategory',
        }));
    }

    private async getGraphqlViewer() {
        return {
            branch: {
                resourcesActivated: false,
                currency: 'PLN',
                vatRates: [23, 8, 5, 0],
                vatPayer: true,
                __typename: 'Branch',
            },
            abilities: [],
            __typename: 'Viewer',
        };
    }

    private async getGraphqlEmployees() {
        const employees = await this.usersRepository.find({
            where: { role: In([Role.Employee, Role.Admin]) },
            order: { id: 'ASC' },
        });

        return {
            items: employees.map((employee) => {
                const { firstName, lastName } = this.splitEmployeeName(employee);
                return {
                    id: employee.id,
                    firstName,
                    lastName,
                    __typename: 'Employee',
                };
            }),
            __typename: 'Employees',
        };
    }

    private async getGraphqlServicesLegacy(variables?: Record<string, unknown>) {
        const services = await this.getGraphqlServices(variables);

        return {
            all: services.items.length,
            items: services.items.map((service) => ({
                id: service.id,
                name: service.name,
                variants: service.variants.map((variant) => ({
                    id: variant.id,
                    name: variant.name,
                    duration: variant.duration,
                    price: variant.price,
                    maxPrice: variant.maxPrice,
                    vat: variant.vat,
                    popularity: 0,
                    breakDuration: variant.breakDuration,
                    prepaymentValue: variant.prepaymentAmount,
                })),
                category: service.category
                    ? {
                          id: service.category.id,
                          name: service.category.name,
                      }
                    : null,
                requiredResources: [],
            })),
        };
    }

    private async getGraphqlServices(variables?: Record<string, unknown>) {
        const filter =
            typeof variables?.filter === 'object' && variables?.filter
                ? (variables.filter as { q?: string })
                : undefined;
        const q = (filter?.q ?? '').trim().toLowerCase();

        const qb = this.servicesRepository
            .createQueryBuilder('service')
            .leftJoinAndSelect('service.variants', 'variant')
            .leftJoinAndSelect('service.categoryRelation', 'category')
            .leftJoinAndSelect('service.employeeServices', 'employeeServices')
            .where('service.isActive = :active', { active: true })
            .orderBy('service.sortOrder', 'ASC')
            .addOrderBy('service.id', 'ASC');

        if (q) {
            qb.andWhere(
                new Brackets((inner) => {
                    inner.where('LOWER(service.name) LIKE :q', {
                        q: `%${q}%`,
                    });
                }),
            );
        }

        const services = await qb.getMany();

        const items = services.map((service) => {
            const baseVariants =
                service.variants && service.variants.length > 0
                    ? service.variants
                    : [
                          {
                              id: service.id,
                              name: null,
                              duration: service.duration,
                              price: service.price,
                              vatRate: service.vatRate,
                          },
                      ];

            const variants = baseVariants.map((variant) => {
                const assignments = (service.employeeServices ?? []).filter(
                    (entry) =>
                        !entry.serviceVariantId ||
                        entry.serviceVariantId === (variant as { id: number }).id,
                );

                return {
                    id: (variant as { id: number }).id,
                    name: (variant as { name?: string | null }).name ?? null,
                    duration:
                        (variant as { duration?: number }).duration ??
                        service.duration,
                    durationBefore: 0,
                    durationAfter: 0,
                    breakOffset: 0,
                    breakDuration: 0,
                    price:
                        this.toNumber((variant as { price?: unknown }).price) ??
                        this.toNumber(service.price) ??
                        0,
                    maxPrice: null,
                    prepaymentAmount: 0,
                    vat: this.toNumber(service.vatRate) ?? 23,
                    employees: assignments.map((assignment) => ({
                        duration:
                            assignment.customDuration ??
                            (variant as { duration?: number }).duration ??
                            service.duration,
                        employee: {
                            id: assignment.employeeId,
                            __typename: 'Employee',
                        },
                        __typename: 'ServiceEmployee',
                    })),
                    __typename: 'ServiceWithInsecureMedicalDataVariant',
                };
            });

            return {
                id: service.id,
                name: service.name,
                loyaltyPoints: null,
                loyaltyStandardConversion: true,
                variants,
                category: service.categoryRelation
                    ? {
                          name: service.categoryRelation.name,
                          id: service.categoryRelation.id,
                          __typename: 'ServiceCategory',
                      }
                    : null,
                requiredResources: [],
                __typename: 'ServiceWithInsecureMedicalData',
            };
        });

        return {
            cursor: Buffer.from('VERSUM_COMPAT_CURSOR').toString('hex'),
            hasNext: false,
            items,
            __typename: 'Services',
        };
    }

    private async getDefaultEmployeeIds() {
        const employees = await this.usersRepository.find({
            where: { role: In([Role.Employee, Role.Admin]) },
            order: { id: 'ASC' },
        });
        return employees.map((employee) => employee.id);
    }

    private splitEmployeeName(user: User) {
        const firstName = user.firstName?.trim();
        const lastName = user.lastName?.trim();
        if (firstName || lastName) {
            return {
                firstName: firstName || '',
                lastName: lastName || '',
            };
        }

        const parts = (user.name || '').trim().split(/\s+/).filter(Boolean);
        return {
            firstName: parts[0] || '',
            lastName: parts.slice(1).join(' '),
        };
    }

    private async getEmployeeDaySchedule(employeeId: number, date: Date) {
        const timetable = await this.timetablesRepository.findOne({
            where: {
                employeeId,
                isActive: true,
            },
            order: {
                validFrom: 'DESC',
            },
        });

        const dayOfWeek = this.toIsoDayOfWeek(date);
        const openSlots = (timetable?.slots ?? [])
            .filter((slot) => slot.dayOfWeek === dayOfWeek && !slot.isBreak)
            .map((slot) => ({
                startMinutes: this.timeToMinutes(slot.startTime),
                endMinutes: this.timeToMinutes(slot.endTime),
            }))
            .filter((slot) => slot.endMinutes > slot.startMinutes)
            .sort((a, b) => a.startMinutes - b.startMinutes);

        const slots =
            openSlots.length > 0
                ? openSlots
                : [{ startMinutes: 9 * 60, endMinutes: 17 * 60 }];

        const normalized = this.mergeSlots(slots);
        const segments: Array<Record<string, unknown>> = [];

        let cursor = 0;
        for (const slot of normalized) {
            if (slot.startMinutes > cursor) {
                segments.push({
                    valid_from: this.withMinutes(date, cursor),
                    valid_to: this.withMinutes(date, slot.startMinutes),
                    kind: 'closed',
                    allday: false,
                });
            }

            segments.push({
                valid_from: this.withMinutes(date, slot.startMinutes),
                valid_to: this.withMinutes(date, slot.endMinutes),
                kind: 'open',
                kind_extension: null,
                kind_extension_name: null,
                allday: false,
            });

            cursor = slot.endMinutes;
        }

        if (cursor < 24 * 60) {
            segments.push({
                valid_from: this.withMinutes(date, cursor),
                valid_to: this.withMinutes(this.addDays(date, 1), 0),
                kind: 'closed',
                allday: false,
            });
        }

        return segments;
    }

    private pickPaymentMethod(payload: Record<string, unknown>) {
        const raw = payload.payment_method;
        if (typeof raw !== 'string') {
            return PaymentMethod.Card;
        }

        switch (raw) {
            case 'cash':
                return PaymentMethod.Cash;
            case 'credit_card':
                return PaymentMethod.Card;
            case 'transfer':
                return PaymentMethod.Transfer;
            case 'online':
                return PaymentMethod.Online;
            case 'certificate':
                return PaymentMethod.Voucher;
            default:
                return PaymentMethod.Card;
        }
    }

    private toVersumPaymentMethod(paymentMethod?: PaymentMethod) {
        switch (paymentMethod) {
            case PaymentMethod.Cash:
                return 'cash';
            case PaymentMethod.Card:
                return 'credit_card';
            case PaymentMethod.Transfer:
                return 'transfer';
            case PaymentMethod.Online:
                return 'online';
            case PaymentMethod.Voucher:
                return 'certificate';
            default:
                return null;
        }
    }

    private paymentMethodLabel(paymentMethod?: PaymentMethod) {
        switch (paymentMethod) {
            case PaymentMethod.Cash:
                return 'gotówka';
            case PaymentMethod.Card:
                return 'karta kredytowa';
            case PaymentMethod.Transfer:
                return 'przelew';
            case PaymentMethod.Online:
                return 'online';
            case PaymentMethod.Voucher:
                return 'bon';
            default:
                return null;
        }
    }

    private statusLabel(status: AppointmentStatus) {
        switch (status) {
            case AppointmentStatus.Completed:
                return 'Sfinalizowana';
            case AppointmentStatus.Cancelled:
                return 'Anulowana';
            case AppointmentStatus.NoShow:
                return 'Nieodbyta';
            case AppointmentStatus.Confirmed:
                return 'Potwierdzona';
            case AppointmentStatus.InProgress:
                return 'W trakcie';
            default:
                return 'Oczekująca';
        }
    }

    private getScheduleRange(date: Date, period: string) {
        const normalizedPeriod = (period || '').toLowerCase();

        if (normalizedPeriod === 'month') {
            const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
            const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
            return { days: this.eachDay(start, end) };
        }

        if (normalizedPeriod === 'agendaweek') {
            const start = this.startOfIsoWeek(date);
            const end = this.addDays(start, 6);
            return { days: this.eachDay(start, end) };
        }

        return { days: [this.startOfDay(date)] };
    }

    private eachDay(start: Date, end: Date) {
        const days: Date[] = [];
        let cursor = this.startOfDay(start);
        const last = this.startOfDay(end);

        while (cursor <= last) {
            days.push(cursor);
            cursor = this.addDays(cursor, 1);
        }

        return days;
    }

    private startOfIsoWeek(date: Date) {
        const day = this.toIsoDayOfWeek(date);
        return this.addDays(this.startOfDay(date), -day);
    }

    private toIsoDayOfWeek(date: Date): DayOfWeek {
        const day = (date.getUTCDay() + 6) % 7;
        return day as DayOfWeek;
    }

    private toDateKey(date: Date) {
        const y = date.getUTCFullYear();
        const m = String(date.getUTCMonth() + 1).padStart(2, '0');
        const d = String(date.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    private withMinutes(date: Date, minutes: number) {
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth();
        const day = date.getUTCDate();
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;
        const utc = new Date(Date.UTC(year, month, day, hour, minute, 0, 0));
        return this.toWarsawIso(utc);
    }

    private timeToMinutes(time: string) {
        const [hour, minute] = time.split(':').map((v) => parseInt(v, 10) || 0);
        return hour * 60 + minute;
    }

    private mergeSlots(
        slots: Array<{ startMinutes: number; endMinutes: number }>,
    ) {
        if (slots.length === 0) return slots;
        const merged: Array<{ startMinutes: number; endMinutes: number }> = [
            { ...slots[0] },
        ];

        for (let i = 1; i < slots.length; i += 1) {
            const current = slots[i];
            const last = merged[merged.length - 1];
            if (current.startMinutes <= last.endMinutes) {
                last.endMinutes = Math.max(last.endMinutes, current.endMinutes);
            } else {
                merged.push({ ...current });
            }
        }

        return merged;
    }

    private diffMinutes(start: Date, end: Date) {
        return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
    }

    private formatMinutes(minutes: number) {
        if (minutes <= 0) return '0 min';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0 && m > 0) return `${h} h ${m} min`;
        if (h > 0) return `${h} h`;
        return `${m} min`;
    }

    private toInitials(name?: string) {
        if (!name) return 'NA';
        const parts = name.trim().split(/\s+/).slice(0, 2);
        return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
    }

    private formatPln(value: number) {
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    }

    private formatLastUpdate(date: Date) {
        const d = this.toWarsawDate(date);
        const dd = String(d.day).padStart(2, '0');
        const mm = String(d.month).padStart(2, '0');
        const yyyy = String(d.year);
        const hh = String(d.hour).padStart(2, '0');
        const min = String(d.minute).padStart(2, '0');
        return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
    }

    private isTruthy(value: unknown) {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value !== 0;
        if (typeof value === 'string') {
            const normalized = value.trim().toLowerCase();
            return normalized === 'true' || normalized === '1' || normalized === 'yes';
        }
        return false;
    }

    private toNumber(value: unknown) {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            const n = Number(value);
            return Number.isFinite(n) ? n : null;
        }
        if (value === null || value === undefined) return null;
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    }

    private startOfDay(date: Date) {
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    }

    private addDays(date: Date, days: number) {
        return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
    }

    private toWarsawDate(date: Date) {
        const formatter = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Europe/Warsaw',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23',
        });

        const parts = formatter.formatToParts(date);
        const get = (type: string) =>
            Number(parts.find((part) => part.type === type)?.value ?? 0);

        return {
            year: get('year'),
            month: get('month'),
            day: get('day'),
            hour: get('hour'),
            minute: get('minute'),
            second: get('second'),
        };
    }

    private toWarsawIso(date: Date) {
        const d = this.toWarsawDate(date);
        const localIso = `${String(d.year).padStart(4, '0')}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}T${String(d.hour).padStart(2, '0')}:${String(d.minute).padStart(2, '0')}:${String(d.second).padStart(2, '0')}.000`;

        const utcFromLocal = Date.UTC(
            d.year,
            d.month - 1,
            d.day,
            d.hour,
            d.minute,
            d.second,
            0,
        );

        const offsetMinutes = Math.round((utcFromLocal - date.getTime()) / 60000);
        const sign = offsetMinutes >= 0 ? '+' : '-';
        const abs = Math.abs(offsetMinutes);
        const offsetHours = String(Math.floor(abs / 60)).padStart(2, '0');
        const offsetMins = String(abs % 60).padStart(2, '0');

        return `${localIso}${sign}${offsetHours}:${offsetMins}`;
    }
}
