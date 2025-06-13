import './bootstrap';

import Alpine from 'alpinejs';
import { createModal } from './createModal';
import { viewModal }   from './viewModal';
import { editModal }   from './editModal';

// Uniwersalna funkcja zamykająca oba modale
window.closeAllModals = function() {
        const event1 = new CustomEvent('force-close-appointment-modal');
        const event2 = new CustomEvent('force-close-admin-create-modal');
        const event3 = new CustomEvent('force-close-edit-modal');
        window.dispatchEvent(event1);
        window.dispatchEvent(event2);
        window.dispatchEvent(event3);
};

Alpine.data('createModal', createModal);
Alpine.data('viewModal', viewModal);
Alpine.data('editModal', editModal);

window.Alpine = Alpine;
Alpine.start();

// Calendar po Alpine!
import './calendar';
