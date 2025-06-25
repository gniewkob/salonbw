export function appointmentForm(services, initialVariantId = null) {
    return {
        services,
        service_id: '',
        variants: [],
        variant_id: '',
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
        }
    };
}
