import { Calendar }      from '@fullcalendar/core';
import dayGridPlugin     from '@fullcalendar/daygrid';
import timeGridPlugin    from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import plLocale          from '@fullcalendar/core/locales/pl';

window.FullCalendar ??= {
    Calendar,
    dayGridPlugin,
    timeGridPlugin,
    interactionPlugin,
};

document.addEventListener('DOMContentLoaded', () => {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    const eventsUrl = calendarEl.dataset.eventsUrl;
    const detailUrl = calendarEl.dataset.detailUrl;     // nowy: URL do pobrania jednej wizyty
    const updateUrl = calendarEl.dataset.updateUrl;

    const calendar = new Calendar(calendarEl, {
        plugins     : [dayGridPlugin, timeGridPlugin, interactionPlugin],
        initialView : 'timeGridWeek',
        locale      : plLocale,
        height      : 'auto',
        editable    : true,
        events      : eventsUrl,

        dateClick(info) {
            const h = new Date(info.dateStr).getHours();
            if (h < 9 || h > 17) {
                alert('Można umawiać tylko w godzinach 9:00–18:00');
                return;
            }

            const modal = document.getElementById('adminCreateModal');
            if (!modal.__x && window.Alpine?.initTree) {
                window.Alpine.initTree(modal);
            }

            if (modal.__x?.$data) {
                modal.__x.$data.date       = info.dateStr;
                modal.__x.$data.user_id    = '';
                modal.__x.$data.variant_id = '';
                modal.__x.$data.open       = true;
            } else {
                console.error('Modal «adminCreateModal» nadal bez Alpine');
            }
        },

        eventClick(info) {
            const modal = document.getElementById('appointmentModal');
            if (!modal.__x && window.Alpine?.initTree) {
                window.Alpine.initTree(modal);
            }

            if (!detailUrl) {
                console.error('Nie skonfigurowano data-detail-url na elemencie calendar');
                return;
            }

            fetch(detailUrl.replace(':id', info.event.id))
                .then(r => r.ok ? r.json() : Promise.reject())
                .then(data => {
                    modal.__x.$data.appointment = data;
                    modal.__x.$data.open        = true;
                })
                .catch(() => alert('Błąd pobierania szczegółów wizyty'));
        },

        eventDrop(info) {
            fetch(updateUrl.replace(':id', info.event.id), {
                method : 'PUT',
                headers: {
                    'Content-Type' : 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
                body: JSON.stringify({
                    appointment_at: info.event.start.toISOString(),
                }),
            })
            .then(r => r.ok ? r.json() : Promise.reject())
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
