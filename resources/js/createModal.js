export function createModal() {
  return {
	open: false,
	date: '',
	user_id: '',
	variant_id: '',
	users: [],
	variants: [],
	init() {
	  fetch(this.$root.dataset.usersUrl)
		.then(r => r.json())
		.then(d => this.users = d);
	  fetch(this.$root.dataset.variantsUrl)
		.then(r => r.json())
		.then(d => this.variants = d);
	},
	save() {
	  if (!this.user_id || !this.variant_id) {
		return alert('Wybierz klienta i wariant usługi');
	  }
	  fetch('/admin/kalendarz/store', {
		method: 'POST',
		headers: {
		  'Content-Type': 'application/json',
		  'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]').content,
		},
		body: JSON.stringify({
		  user_id: this.user_id,
		  variant_id: this.variant_id,
		  appointment_at: this.date
		})
	  })
	  .then(r => r.ok ? location.reload() : Promise.reject())
	  .catch(() => alert('Błąd tworzenia rezerwacji'));
	}
  };
}
