export function editFullModal() {
  return {
    open: false,
    appointment: {},
    date: '',
    user_id: null,
    service_id: '',
    variant_id: '',
    price: 0,
    discount_percent: 0,
    note_client: '',
    note_internal: '',
    status: '',
    service_description: '',
    products_used: '',
    users: [],
    services: [],
    variants: [],
    init() {
      window.addEventListener('open-edit-full-modal', e => {
        if (window.modalIsOpen) return;
        const data = e.detail;
        this.appointment = data;
        this.date = data.datetime.replace(' ', 'T');
        this.user_id = data.user_id;
        this.service_id = data.service_id;
        this.variant_id = data.service_variant_id;
        this.price = data.price_pln;
        this.discount_percent = data.discount_percent;
        this.note_client = data.note_client || '';
        this.note_internal = data.note_internal || '';
        this.status = data.status || 'zaplanowana';
        this.service_description = data.service_description || '';
        this.products_used = data.products_used || '';
        this.open = true;
        window.modalIsOpen = true;
        document.body.classList.add('modal-open');
        this.loadVariants();
      });
      window.addEventListener('force-close-edit-full-modal', () => this.close());

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
      window.modalIsOpen = false;
      document.body.classList.remove('modal-open');
    },
    async save() {
      if (!this.user_id || !this.variant_id || !this.date) {
        return alert('Uzupełnij wszystkie pola');
      }
      try {
        const res = await fetch(`/admin/kalendarz/appointments/${this.appointment.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
          },
          body: JSON.stringify({
            user_id: this.user_id,
            service_variant_id: this.variant_id,
            appointment_at: this.date,
            status: this.status,
            price_pln: this.price,
            discount_percent: this.discount_percent,
            note_client: this.note_client,
            note_internal: this.note_internal,
            service_description: this.service_description,
            products_used: this.products_used,
          }),
        });
        if (!res.ok) throw new Error();
        this.close();
        window.location.reload();
      } catch {
        alert('Nie udało się zaktualizować rezerwacji');
      }
    },
    async destroy() {
      if (!confirm('Czy na pewno chcesz usunąć wizytę?')) return;
      try {
        const res = await fetch(`/admin/kalendarz/appointments/${this.appointment.id}`, {
          method: 'DELETE',
          headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content },
        });
        if (!res.ok) throw new Error();
        this.close();
        window.location.reload();
      } catch {
        alert('Nie udało się usunąć rezerwacji');
      }
    },
  }
}
