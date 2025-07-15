import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';

document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('calendar');
    if (!el) return;
    const url = el.dataset.eventsUrl;
    const calendar = new Calendar(el, {
        plugins: [dayGridPlugin, timeGridPlugin, listPlugin],
        initialView: 'timeGridWeek',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek'
        },
        locale: 'pl',
        events: url,
    });
    calendar.render();
});
