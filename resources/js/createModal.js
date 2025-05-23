export function createModal() {
  return {
	open: false,
	date: '',
	user_id: null,
	variant_id: null,
	users: [],
	variants: [],

	init() {
	  window.addEventListener('open-create-modal', e => {
		if (window.modalIsOpen) return;
		this.date = e.detail;
		this.open = true;
		window.modalIsOpen = true; // modal otwarty
		document.body.classList.add('modal-open');
	  });

	  fetch('/admin/api/users')
		.then(r => r.ok ? r.json() : [])
		.then(data => this.users = data)
		.catch(() => console.error('Users load error'));

	  fetch('/admin/api/variants')
		.then(r => r.ok ? r.json() : [])
		.then(data => this.variants = data)
		.catch(() => console.error('Variants load error'));
	},

	close() {
	  this.open = false;
	  window.modalIsOpen = false; // odblokuj
	  document.body.classList.remove('modal-open');
	},

	async save() {
	  if (!this.user_id || !this.variant_id) {
		return alert('Wybierz klienta oraz wariant usługi');
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
