export function createModal() {
  return {
	open: false,
        date: '',
        user_id: null,
        service_id: '',
        variant_id: '',
        price: 0,
        discount_percent: 0,
        users: [],
        services: [],
        variants: [],

	init() {
          window.addEventListener('open-create-modal', e => {
                if (window.modalIsOpen) return;
                this.date = e.detail.substring(0,16);
                this.open = true;
                window.modalIsOpen = true; // modal otwarty
                document.body.classList.add('modal-open');
          });
          window.addEventListener('force-close-admin-create-modal', () => this.close());

          fetch('/admin/api/users')
                .then(r => r.ok ? r.json() : [])
                .then(data => this.users = data)
                .catch(() => console.error('Users load error'));

          fetch('/admin/api/services')
                .then(r => r.ok ? r.json() : [])
                .then(data => this.services = data)
                .catch(() => console.error('Services load error'));

          this.$watch('service_id', () => this.loadVariants());
          this.$watch('variant_id', () => this.setPrice());
          this.$watch('discount_percent', () => this.setPrice());
       },

        loadVariants() {
          if (!this.service_id) {
                this.variants = [];
                this.variant_id = '';
                this.price = 0;
                return;
          }
          fetch(`/admin/api/services/${this.service_id}/variants`)
                .then(r => r.ok ? r.json() : [])
                .then(data => {
                      this.variants = data;
                      this.setPrice();
                })
                .catch(() => {
                      console.error('Variants load error');
                      this.variants = [];
                });
       },

        setPrice() {
          const v = this.variants.find(v => v.id == this.variant_id);
          const base = v ? v.price_pln : 0;
          this.price = Math.round(base * (100 - this.discount_percent) / 100);
        },

	close() {
	  this.open = false;
	  window.modalIsOpen = false; // odblokuj
	  document.body.classList.remove('modal-open');
	},

        async save() {
          if (!this.user_id || !this.variant_id || !this.date) {
                return alert('Uzupełnij wszystkie pola');
          }
          try {
                const res = await fetch('/admin/kalendarz/store', {
                  method: 'POST',
                  headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                  },
                  body: JSON.stringify({
                        user_id: this.user_id,
                        service_variant_id: this.variant_id,
                        price_pln: this.price,
                        discount_percent: this.discount_percent,
                        appointment_at: this.date,
                  })
                });
		if (!res.ok) throw new Error;
		this.close();
		window.location.reload();
	  } catch {
		alert('Nie udało się zapisać rezerwacji');
	  }
	}
  }
}
