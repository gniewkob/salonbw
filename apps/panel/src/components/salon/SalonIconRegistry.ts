import type { ComponentType, SVGProps } from 'react';
import {
    AdjustmentsHorizontalIcon,
    ArchiveBoxIcon,
    BanknotesIcon,
    BellIcon,
    BoltIcon,
    BuildingStorefrontIcon,
    CalendarDaysIcon,
    CalendarIcon,
    ChartBarIcon,
    ChatBubbleLeftEllipsisIcon,
    ChatBubbleLeftRightIcon,
    ClipboardDocumentCheckIcon,
    ClockIcon,
    Cog6ToothIcon,
    EnvelopeIcon,
    MegaphoneIcon,
    QuestionMarkCircleIcon,
    ScissorsIcon,
    ShareIcon,
    SquaresPlusIcon,
    StarIcon,
    UserGroupIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';

export type SalonIconComponent = ComponentType<SVGProps<SVGSVGElement>>;

/**
 * Legacy iconId → Heroicon mapping. The iconId values come from
 * SALON_MODULES (navigation.ts) and a few standalone consumers
 * (SalonTopbar, FloatingHelpButton, settings/index.tsx tiles). Keep the
 * `svg-` prefix so existing call sites don't need to change — the prefix
 * is just an opaque key now, not an actual SVG symbol ID.
 */
export const SALON_ICON_REGISTRY: Record<string, SalonIconComponent> = {
    // Main navigation modules
    'svg-calendar-nav': CalendarIcon,
    'svg-customers-nav': UsersIcon,
    'svg-stock-nav': ArchiveBoxIcon,
    'svg-statistics-nav': ChartBarIcon,
    'svg-communication-nav': ChatBubbleLeftRightIcon,
    'svg-services-nav': ScissorsIcon,
    'svg-settings-nav': Cog6ToothIcon,
    'svg-extensions-nav': SquaresPlusIcon,

    // Topbar / FAB / help
    'svg-help': QuestionMarkCircleIcon,
    'svg-notifications': BellIcon,
    'svg-todo': ClipboardDocumentCheckIcon,
    'svg-message': EnvelopeIcon,
    'svg-chat': ChatBubbleLeftEllipsisIcon,

    // Settings module tiles (these IDs were broken before — referenced but
    // not present in the old sprite sheet)
    'svg-salon': BuildingStorefrontIcon,
    'svg-opening_hours_clock': ClockIcon,
    'svg-calendar': CalendarIcon,
    'svg-employees': UserGroupIcon,
    'svg-customers': UsersIcon,
    'svg-booking': CalendarDaysIcon,
    'svg-communication': ChatBubbleLeftRightIcon,
    'svg-client_communication': ChatBubbleLeftEllipsisIcon,
    'svg-prepayments': BanknotesIcon,
    'svg-social_media': ShareIcon,
    'svg-automatic_marketing': MegaphoneIcon,
    'svg-work_schedule': CalendarIcon,
    'svg-extra_settings': AdjustmentsHorizontalIcon,
    'svg-moment_power': BoltIcon,
    'svg-settings_opinions': StarIcon,
};

export function resolveSalonIcon(id: string): SalonIconComponent | undefined {
    return SALON_ICON_REGISTRY[id];
}
