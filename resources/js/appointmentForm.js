import { initUserCalendar } from './userCalendar';

export function appointmentForm(services, initialVariantId = null) {
    return {
        services,
        service_id: '',
        variants: [],
        variant_id: '',
        calendar: null,
        init() {
            if (initialVariantId) {
                for (const s of this.services) {
                    const match = s.variants.find(v => v.id == initialVariantId);
                    if (match) {
                        this.service_id = s.id;
                        this.variants = s.variants;
                        this.variant_id = initialVariantId;
                        break;
                    }
                }
            }
            this.$watch('service_id', (value) => {
                const s = this.services.find(s => s.id == value);
                this.variants = s ? s.variants : [];
                if (!this.variants.some(v => v.id == this.variant_id)) {
                    this.variant_id = '';
                }
            });

            this.calendar = initUserCalendar(60);
            this.calendar.init();
            this.$watch('variant_id', id => {
                const d = this.variants.find(v => v.id == id)?.duration_minutes || 60;
                this.calendar.setDuration(d);
            });
        }
    };
}
