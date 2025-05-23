import { Calendar } from '@fullcalendar/core';
import dayGridPlugin     from '@fullcalendar/daygrid';
import timeGridPlugin    from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin        from '@fullcalendar/list';

document.addEventListener('DOMContentLoaded', () => {
  const el  = document.getElementById('calendar');
  const url = el.dataset.eventsUrl;

  const calendar = new Calendar(el, {
    plugins: [ dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin ],
    initialView: 'timeGridWeek',
    locale: 'pl',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    events: url,

    dateClick(info) {
      window.dispatchEvent(new CustomEvent('open-create-modal', { detail: info.dateStr }));
    },

    eventClick(info) {
      window.dispatchEvent(new CustomEvent('open-view-modal', { detail: info.event.extendedProps }));
    },

    editable: true,
  });

  calendar.render();
});
