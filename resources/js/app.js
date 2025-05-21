import './bootstrap';
import './calendar';
import Alpine from 'alpinejs';

import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

window.FullCalendar = {
	Calendar,
	dayGridPlugin,
	timeGridPlugin,
	interactionPlugin,
};

window.Alpine = Alpine;

Alpine.start();
