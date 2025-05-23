import { Calendar }      from '@fullcalendar/core';
import dayGridPlugin     from '@fullcalendar/daygrid';
import timeGridPlugin    from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import plLocale          from '@fullcalendar/core/locales/pl';

window.FullCalendar ??= { Calendar, dayGridPlugin, timeGridPlugin, interactionPlugin };

export default function () {
  const el = document.getElementById('calendar');
  if (!el) return;

  const { eventsUrl, detailUrl, updateUrl, usersUrl, variantsUrl } = el.dataset;

  const calendar = new Calendar(el, {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    locale: plLocale,
    height: 'auto',
    editable: true,
    events: eventsUrl,

    dateClick(info) {
      const h = new Date(info.dateStr).getHours();
      if (h < 9 || h > 17) {
        return alert('Można umawiać tylko w godzinach 9:00–18:00');
      }
      const modal = document.getElementById('adminCreateModal');
      modal.__x.$data.date = info.dateStr;
      modal.__x.$data.open = true;
    },

    eventClick(info) {
      fetch(detailUrl.replace(':id', info.event.id))
        .then(r => r.json())
        .then(data => {
          const modal = document.getElementById('appointmentModal');
          modal.__x.$data.appointment = data;
          modal.__x.$data.open        = true;
        })
        .catch(() => alert('Błąd pobierania szczegółów wizyty'));
    },

    eventDrop(info) {
      fetch(updateUrl.replace(':id', info.event.id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]').content,
        },
        body: JSON.stringify({ appointment_at: info.event.start.toISOString() }),
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
}
