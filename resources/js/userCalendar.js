import { Calendar } from '@fullcalendar/core';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

export function initUserCalendar(duration) {
    return {
        duration,
        events: [],
        setDuration(value) {
            this.duration = value;
        },
        init() {
            const el = document.getElementById('user-calendar');
            if (!el) return;
            const url = el.dataset.busyUrl;
            const input = document.querySelector('input[name="appointment_at"]');
            fetch(url)
                .then(r => r.ok ? r.json() : [])
                .then(events => {
                    this.events = events;
                    const calendar = new Calendar(el, {
                        plugins: [timeGridPlugin, interactionPlugin],
                        initialView: 'timeGridWeek',
                        locale: 'pl',
                        selectable: true,
                        events,
                        businessHours: {
                            startTime: '09:00',
                            endTime: '18:00',
                            daysOfWeek: [1,2,3,4,5,6],
                        },
                        selectOverlap: false,
                        select: info => {
                            const start = info.start;
                            const end = new Date(start.getTime() + this.duration*60000);
                            for (const e of this.events) {
                                const estart = new Date(e.start);
                                const eend = new Date(e.end);
                                if (start < eend && end > estart) {
                                    calendar.unselect();
                                    return alert('Wybrany termin jest zajęty.');
                                }
                            }
                            input.value = start.toISOString().slice(0,16);
                        }
                    });
                    calendar.render();
                });
        }
    }
}
