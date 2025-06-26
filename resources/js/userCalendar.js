import { Calendar } from '@fullcalendar/core';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

export function initUserCalendar(duration) {
    return {
        duration,
        events: [],
        initialized: false,
        calendar: null,
        tempEvent: null,
        setDuration(value) {
            this.duration = value;
        },
        init() {
            if (this.initialized) return;
            const el = document.getElementById('user-calendar');
            if (!el) return;
            const url = el.dataset.busyUrl;
            const msgUrl = el.dataset.msgUrl;
            const input = document.querySelector('input[name="appointment_at"]');
            const notice = document.getElementById('calendar-notice');
            const submitBtn = document.getElementById('submit-appointment');
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
                            const end = new Date(start.getTime() + this.duration * 60000);

                            if (this.tempEvent) {
                                this.tempEvent.remove();
                                this.tempEvent = null;
                            }

                            let overlap = false;
                            for (const e of this.events) {
                                const estart = new Date(e.start);
                                const eend = new Date(e.end);
                                if (start < eend && end > estart) {
                                    overlap = true;
                                    break;
                                }
                            }

                            const color = overlap ? 'red' : 'green';
                            this.tempEvent = calendar.addEvent({
                                id: 'temp-selection',
                                start,
                                end,
                                backgroundColor: color,
                                borderColor: color,
                            });

                            if (overlap) {
                                input.value = '';
                                if (notice) {
                                    notice.classList.remove('hidden');
                                    notice.classList.remove('bg-green-100', 'text-green-700');
                                    notice.classList.add('bg-red-100', 'text-red-700');
                                    const href = `${msgUrl}?category=rezerwacja&datetime=${start.toISOString()}`;
                                    notice.innerHTML = `Wybrany termin jest zaj\u0119ty. <a href="${href}" class="underline">Wy\u015blij wiadomo\u015b\u0107</a>`;
                                }
                                if (submitBtn) submitBtn.disabled = true;
                            } else {
                                input.value = start.toISOString().slice(0,16);
                                if (notice) {
                                    notice.classList.remove('hidden');
                                    notice.classList.remove('bg-red-100', 'text-red-700');
                                    notice.classList.add('bg-green-100', 'text-green-700');
                                    notice.textContent = 'Termin wolny. Mo\u017cesz zarezerwowa\u0107.';
                                }
                                if (submitBtn) submitBtn.disabled = false;
                            }
                        }
                    });
                    calendar.render();
                    this.calendar = calendar;
                    this.initialized = true;
                });
        }
    }
}
