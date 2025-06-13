export function editModal() {
  return {
    open: false,
    appointment: {},
    date: '',
    user_id: null,
    service_id: null,
    variant_id: null,
    status: '',
    users: [],
    services: [],
    variants: [],
    init() {
      window.addEventListener('open-edit-modal', e => {
        if (window.modalIsOpen) return;
        this.appointment = e.detail;
        this.date = e.detail.datetime.replace(' ', 'T');
        this.user_id = e.detail.user_id;
        this.service_id = e.detail.service_id;
        this.variant_id = e.detail.service_variant_id;
        this.status = e.detail.status;
        this.open = true;
        window.modalIsOpen = true;
        document.body.classList.add('modal-open');
        this.loadData();
      });
      window.addEventListener('force-close-edit-modal', () => this.close());
      this.$watch('service_id', () => this.loadVariants());
    },
    async loadData() {
      try {
        const [u, s] = await Promise.all([
          fetch('/admin/api/users').then(r => r.ok ? r.json() : []),
          fetch('/admin/api/services').then(r => r.ok ? r.json() : []),
        ]);
        this.users = u;
        this.services = s;
        await this.loadVariants();
      } catch {
        console.error('Load data error');
      }
    },
    async loadVariants() {
      if (!this.service_id) { this.variants = []; return; }
      try {
        const v = await fetch(`/admin/api/services/${this.service_id}/variants`).then(r => r.ok ? r.json() : []);
        this.variants = v;
      } catch {
        console.error('Variants load error');
        this.variants = [];
      }
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
          }),
        });
        if (!res.ok) throw new Error();
        this.close();
        window.location.reload();
      } catch {
        alert('Nie udało się zaktualizować rezerwacji');
      }
    },
    async remove() {
      if (!confirm('Na pewno usunąć rezerwację?')) return;
      try {
        const res = await fetch(`/admin/kalendarz/appointments/${this.appointment.id}`, {
          method: 'DELETE',
          headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content }
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
