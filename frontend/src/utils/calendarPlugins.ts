// Centralized FullCalendar plugin loader to keep pages simple and avoid
// repeating require calls. Using require with literal module names prevents
// user-controlled dynamic imports.
import type { PluginDef } from '@fullcalendar/core';

export function getCalendarPlugins(): PluginDef[] {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
    const dayGrid = require('@fullcalendar/daygrid').default;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
    const timeGrid = require('@fullcalendar/timegrid').default;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
    const interaction = require('@fullcalendar/interaction').default;
    return [dayGrid, timeGrid, interaction] as unknown as PluginDef[];
}
