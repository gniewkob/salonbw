import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    Between,
    In,
    LessThanOrEqual,
    MoreThanOrEqual,
    Repository,
    FindOptionsWhere,
} from 'typeorm';
import { Log } from './log.entity';
import { LogAction } from './log-action.enum';
import { User } from '../users/user.entity';
import { ActivityCategory } from './dto/get-activity-feed.dto';

type ActivityFeedItem = {
    id: number;
    timestamp: string;
    employeeId: number | null;
    employeeName: string;
    ipAddress: string | null;
    actionKey: string;
    actionLabel: string;
    categoryKey: string;
    categoryLabel: string;
    details: Record<string, unknown> | string | null;
    expandable: boolean;
};

const ACTIVITY_DEFINITIONS: Array<{
    categoryKey: ActivityCategory;
    categoryLabel: string;
    actionKey: string;
    actionLabel: string;
    actions: LogAction[];
}> = [
    {
        categoryKey: 'employees',
        categoryLabel: 'Pracownicy',
        actionKey: 'employee_create',
        actionLabel: 'Dodanie pracownika',
        actions: [LogAction.EMPLOYEE_CREATED],
    },
    {
        categoryKey: 'employees',
        categoryLabel: 'Pracownicy',
        actionKey: 'employee_update',
        actionLabel: 'Edycja pracownika',
        actions: [LogAction.EMPLOYEE_UPDATED],
    },
    {
        categoryKey: 'employees',
        categoryLabel: 'Pracownicy',
        actionKey: 'employee_destroy',
        actionLabel: 'Usunięcie pracownika',
        actions: [LogAction.EMPLOYEE_DELETED],
    },
    {
        categoryKey: 'employees',
        categoryLabel: 'Pracownicy',
        actionKey: 'timetable_employee_update',
        actionLabel: 'Zmiana grafiku pracownika',
        actions: [LogAction.TIMETABLE_UPDATED],
    },
    {
        categoryKey: 'commissions',
        categoryLabel: 'Prowizje',
        actionKey: 'commission_create',
        actionLabel: 'Dodanie prowizji',
        actions: [LogAction.COMMISSION_CREATED],
    },
    {
        categoryKey: 'services',
        categoryLabel: 'Usługi',
        actionKey: 'service_settings_change',
        actionLabel: 'Zmiana parametrów usługi',
        actions: [LogAction.SERVICE_CREATED, LogAction.SERVICE_UPDATED],
    },
    {
        categoryKey: 'services',
        categoryLabel: 'Usługi',
        actionKey: 'service_destroy',
        actionLabel: 'Usunięcie usługi',
        actions: [LogAction.SERVICE_DELETED],
    },
    {
        categoryKey: 'storage',
        categoryLabel: 'Magazyn',
        actionKey: 'product_destroy',
        actionLabel: 'Usunięcie produktu',
        actions: [LogAction.PRODUCT_DELETED],
    },
    {
        categoryKey: 'storage',
        categoryLabel: 'Magazyn',
        actionKey: 'delivery_destroy',
        actionLabel: 'Ręczne usunięcie dostawy',
        actions: [LogAction.DELIVERY_CANCELLED],
    },
    {
        categoryKey: 'calendar',
        categoryLabel: 'Kalendarz',
        actionKey: 'event_beginning_change',
        actionLabel: 'Zmiana terminu wizyty',
        actions: [LogAction.APPOINTMENT_RESCHEDULED],
    },
    {
        categoryKey: 'calendar',
        categoryLabel: 'Kalendarz',
        actionKey: 'event_destroy',
        actionLabel: 'Usunięcie wizyty',
        actions: [LogAction.APPOINTMENT_CANCELLED],
    },
    {
        categoryKey: 'branch',
        categoryLabel: 'Salon',
        actionKey: 'branch_update',
        actionLabel: 'Zmiana danych kontaktowych salonu',
        actions: [LogAction.SETTINGS_BRANCH_UPDATED, LogAction.BRANCH_UPDATED],
    },
    {
        categoryKey: 'branch',
        categoryLabel: 'Salon',
        actionKey: 'timetable_branch_update',
        actionLabel: 'Zmiana godzin otwarcia salonu',
        actions: [LogAction.SETTINGS_CALENDAR_UPDATED],
    },
    {
        categoryKey: 'versum',
        categoryLabel: 'SalonBW',
        actionKey: 'signin',
        actionLabel: 'Zalogowanie do systemu',
        actions: [LogAction.USER_LOGIN],
    },
    {
        categoryKey: 'versum',
        categoryLabel: 'SalonBW',
        actionKey: 'failed_login_attempts',
        actionLabel: 'Nieudane logowanie (3 razy)',
        actions: [LogAction.LOGIN_FAIL],
    },
    {
        categoryKey: 'versum',
        categoryLabel: 'SalonBW',
        actionKey: 'limit_update',
        actionLabel: 'Błąd autoryzacji',
        actions: [LogAction.AUTHORIZATION_FAILURE],
    },
];

const ACTION_TO_DEFINITION = new Map(
    ACTIVITY_DEFINITIONS.flatMap((definition) =>
        definition.actions.map((action) => [action, definition] as const),
    ),
);

@Injectable()
export class LogService {
    constructor(
        @InjectRepository(Log)
        private readonly logRepository: Repository<Log>,
    ) {}

    async logAction(
        user: User | null,
        action: LogAction,
        description?: string | Record<string, any>,
    ): Promise<Log> {
        if (description) {
            const containsSensitiveKey = (
                obj: Record<string, unknown>,
            ): boolean =>
                Object.entries(obj).some(([key, value]) => {
                    if (['password', 'token'].includes(key.toLowerCase())) {
                        return true;
                    }
                    if (typeof value === 'object' && value !== null) {
                        return containsSensitiveKey(
                            value as Record<string, unknown>,
                        );
                    }
                    return false;
                });

            if (typeof description === 'string') {
                const lower = description.toLowerCase();
                if (lower.includes('password') || lower.includes('token')) {
                    throw new Error(
                        'Description contains sensitive information',
                    );
                }
            } else if (
                typeof description === 'object' &&
                description !== null
            ) {
                if (containsSensitiveKey(description)) {
                    throw new Error(
                        'Description contains sensitive information',
                    );
                }
            }
        }

        const logData = {
            user: user ?? null,
            action,
            description,
        };

        if ((this.logRepository.manager.connection.options as any).type === 'sqlite') {
            const result = await this.logRepository.createQueryBuilder()
                .insert()
                .values(logData)
                .execute();
            return { id: result.identifiers[0].id, ...logData } as any;
        }

        return this.logRepository.save(logData);
    }

    async findAll(options: {
        userId?: number;
        action?: LogAction;
        from?: Date;
        to?: Date;
        page?: number;
        limit?: number;
    }): Promise<{ data: Log[]; total: number; page: number; limit: number }> {
        const { userId, action, from, to } = options;
        const page = options.page ?? 1;
        const limit = options.limit ?? 10;

        const where: FindOptionsWhere<Log> = {};

        if (userId) {
            where.user = { id: userId } as User;
        }
        if (action) {
            where.action = action;
        }
        if (from && to) {
            where.timestamp = Between(from, to);
        } else if (from) {
            where.timestamp = MoreThanOrEqual(from);
        } else if (to) {
            where.timestamp = LessThanOrEqual(to);
        }

        const [data, total] = await this.logRepository.findAndCount({
            where,
            order: { timestamp: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { data, total, page, limit };
    }

    async findActivityFeed(options: {
        userId?: number;
        activity?: string;
        category?: ActivityCategory;
        from?: Date;
        to?: Date;
        page?: number;
        limit?: number;
    }): Promise<{
        items: ActivityFeedItem[];
        total: number;
        page: number;
        limit: number;
    }> {
        const where: FindOptionsWhere<Log> = {};
        const page = options.page ?? 1;
        const limit = options.limit ?? 20;
        const actions = this.resolveActions(options.activity, options.category);

        if (options.userId) {
            where.user = { id: options.userId } as User;
        }
        if (actions.length > 0) {
            where.action = In(actions);
        }
        if (options.from && options.to) {
            where.timestamp = Between(options.from, options.to);
        } else if (options.from) {
            where.timestamp = MoreThanOrEqual(options.from);
        } else if (options.to) {
            where.timestamp = LessThanOrEqual(options.to);
        }

        const [data, total] = await this.logRepository.findAndCount({
            where,
            order: { timestamp: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            items: data.map((item) => this.toActivityFeedItem(item)),
            total,
            page,
            limit,
        };
    }

    private resolveActions(activity?: string, category?: ActivityCategory) {
        if (activity) {
            return (
                ACTIVITY_DEFINITIONS.find(
                    (definition) => definition.actionKey === activity,
                )?.actions ?? []
            );
        }
        if (category) {
            return ACTIVITY_DEFINITIONS.filter(
                (definition) => definition.categoryKey === category,
            ).flatMap((definition) => definition.actions);
        }
        return [];
    }

    private toActivityFeedItem(item: Log): ActivityFeedItem {
        const definition = ACTION_TO_DEFINITION.get(item.action);
        const details =
            typeof item.description === 'string'
                ? item.description
                : (item.description ?? null);
        const ipAddress =
            details && typeof details === 'object' && 'ipAddress' in details
                ? String(details.ipAddress ?? '')
                : null;

        return {
            id: item.id,
            timestamp: item.timestamp.toISOString(),
            employeeId: item.user?.id ?? null,
            employeeName: item.user?.name ?? 'System',
            ipAddress: ipAddress || null,
            actionKey: definition?.actionKey ?? item.action.toLowerCase(),
            actionLabel: definition?.actionLabel ?? item.action,
            categoryKey: definition?.categoryKey ?? 'versum',
            categoryLabel: definition?.categoryLabel ?? 'SalonBW',
            details,
            expandable: Boolean(details),
        };
    }
}
