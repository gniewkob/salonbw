export function createModal() {
  return {
	open: false,
        date: '',
        user_id: null,
        service_id: null,
        variant_id: null,
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
       },

        loadVariants() {
          if (!this.service_id) {
                this.variants = [];
                this.variant_id = null;
                return;
          }
          fetch(`/admin/api/services/${this.service_id}/variants`)
                .then(r => r.ok ? r.json() : [])
                .then(data => this.variants = data)
                .catch(() => {
                      console.error('Variants load error');
                      this.variants = [];
                });
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
