// Centralized FullCalendar plugin loader that caches the heavy plugins and
// loads them on-demand so dashboard bundles stay lean.
import type { PluginDef } from '@fullcalendar/core';

let cachedPlugins: PluginDef[] | null = null;
let pendingLoad: Promise<PluginDef[]> | null = null;

export async function getCalendarPlugins(): Promise<PluginDef[]> {
    if (cachedPlugins) {
        return cachedPlugins;
    }
    if (pendingLoad) {
        return pendingLoad;
    }

    pendingLoad = Promise.all([
        import('@fullcalendar/daygrid'),
        import('@fullcalendar/timegrid'),
        import('@fullcalendar/interaction'),
    ])
        .then(([dayGrid, timeGrid, interaction]) => {
            const plugins = [
                dayGrid.default ?? dayGrid,
                timeGrid.default ?? timeGrid,
                interaction.default ?? interaction,
            ] as unknown as PluginDef[];
            cachedPlugins = plugins;
            return plugins;
        })
        .finally(() => {
            pendingLoad = null;
        });

    return pendingLoad;
}

export function resetCalendarPluginsCache() {
    cachedPlugins = null;
    pendingLoad = null;
}
