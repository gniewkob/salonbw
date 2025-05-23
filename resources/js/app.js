import './bootstrap';

import Alpine from 'alpinejs';
import { createModal } from './createModal';
import { viewModal }   from './viewModal';

Alpine.data('createModal', createModal);
Alpine.data('viewModal', viewModal);

window.Alpine = Alpine;
Alpine.start();

// Calendar dopiero po uruchomieniu Alpine
import './calendar';
