import { Calendar }      from '@fullcalendar/core';
import dayGridPlugin     from '@fullcalendar/daygrid';
import timeGridPlugin    from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import plLocale          from '@fullcalendar/core/locales/pl';

/* → DODANE -------------------------------------------------------------------- */
if (!window.FullCalendar) {
    window.FullCalendar = {
        Calendar,
        dayGridPlugin,
        timeGridPlugin,
        interactionPlugin,
    };
}
/* ----------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    const eventsUrl = calendarEl.dataset.eventsUrl;
    const updateUrl = calendarEl.dataset.updateUrl;

    const calendar = new Calendar(calendarEl, {
        plugins     : [dayGridPlugin, timeGridPlugin, interactionPlugin],
        initialView : 'timeGridWeek',
        locale      : plLocale,
        height      : 'auto',
        editable    : true,
        events      : eventsUrl,

        dateClick(info) {
            const hour = new Date(info.dateStr).getHours();
            if (hour < 9 || hour > 17) {
                alert('Można umawiać tylko w godzinach 9:00–18:00');
                return;
            }

            const modal = document.getElementById('adminCreateModal');
            if (!modal) return;

            /* zainicjalizuj Alpine, jeśli trzeba */
            if (!modal.__x && window.Alpine?.initTree) {
                window.Alpine.initTree(modal);
            }

            if (modal.__x?.$data) {
                modal.__x.$data.date = info.dateStr;
                modal.__x.$data.open = true;
            } else {
                console.warn('Modal adminCreateModal nadal bez Alpine – sprawdź markup ✋');
            }
        },

        eventDrop(info) {
            fetch(updateUrl.replace(':id', info.event.id), {
                method : 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document
                        .querySelector('meta[name="csrf-token"]').content,
                },
                body: JSON.stringify({
                    appointment_at: info.event.start.toISOString(),
                }),
            })
            .then(r => (r.ok ? r.json() : Promise.reject()))
            .then(() => calendar.refetchEvents())
            .catch(() => {
                alert('Nie udało się zapisać zmiany daty.');
                info.revert();
            });
        },
    });

    calendar.render();
    window.calendar = calendar;
});
