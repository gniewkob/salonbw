import { Calendar }      from '@fullcalendar/core';
import dayGridPlugin     from '@fullcalendar/daygrid';
import timeGridPlugin    from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import plLocale          from '@fullcalendar/core/locales/pl';

document.addEventListener('DOMContentLoaded', () => {

    /* ---------- element kalendarza ---------- */
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;        //  ← jesteśmy na innej stronie

    const eventsUrl = calendarEl.dataset.eventsUrl;
    const updateUrl = calendarEl.dataset.updateUrl;

    /* ---------- konfiguracja ---------- */
    const calendar = new Calendar(calendarEl, {
        plugins     : [dayGridPlugin, timeGridPlugin, interactionPlugin],
        initialView : 'timeGridWeek',
        locale      : plLocale,
        height      : 'auto',
        editable    : true,
        events      : eventsUrl,

        /* === klik pustego slotu === */
        dateClick(info) {
            const hour = new Date(info.dateStr).getHours();
            if (hour < 9 || hour > 17) {
                alert('Można umawiać tylko w godzinach 9:00–18:00');
                return;
            }

            const modal = document.getElementById('adminCreateModal');
            if (!modal) return;

            // jeśli Alpine nie zdążył „dosadzić” __x, zrób to ręcznie
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

        /* === przeciąganie wizyty === */
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
    window.calendar = calendar;          //  dla modala „Zapisz rezerwację”
});
