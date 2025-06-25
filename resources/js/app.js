import './bootstrap';

import Alpine from 'alpinejs';
import { createModal } from './createModal';
import { viewModal }   from './viewModal';
import { editModal }   from './editModal';
import { editFullModal } from './editFullModal';
import { realizeModal } from './realizeModal';
import { initMap } from './map';

// Uniwersalna funkcja zamykająca oba modale
window.closeAllModals = function() {
        const event1 = new CustomEvent('force-close-appointment-modal');
        const event2 = new CustomEvent('force-close-admin-create-modal');
        const event3 = new CustomEvent('force-close-edit-modal');
        const event4 = new CustomEvent('force-close-edit-full-modal');
        const event5 = new CustomEvent('force-close-realize-modal');
        window.dispatchEvent(event1);
        window.dispatchEvent(event2);
        window.dispatchEvent(event3);
        window.dispatchEvent(event4);
        window.dispatchEvent(event5);
};

Alpine.data('createModal', createModal);
Alpine.data('viewModal', viewModal);
Alpine.data('editModal', editModal);
Alpine.data('editFullModal', editFullModal);
Alpine.data('realizeModal', realizeModal);

window.Alpine = Alpine;
Alpine.start();

// Expose map initialization globally
window.initMap = initMap;


import Swiper from 'swiper/bundle';
import 'swiper/css/bundle';

// Make Swiper accessible in inline scripts
window.Swiper = Swiper;

document.addEventListener('DOMContentLoaded', () => {
    new Swiper('.hero-swiper', {
        loop: true,
        effect: 'fade',
        autoplay: {
            delay: 5000,
        },
        pagination: {
            el: '.hero-swiper .swiper-pagination',
            clickable: true,
        },
    });

    new Swiper('.testimonial-swiper', {
        loop: true,
        autoplay: {
            delay: 7000,
        },
        pagination: {
            el: '.testimonial-swiper .swiper-pagination',
            clickable: true,
        },
    });
});
