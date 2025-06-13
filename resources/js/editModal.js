 export function editModal() {
   return {
     open: false,
     appointment: {},
     date: '',
     init() {
       window.addEventListener('open-edit-modal', e => {
         if (window.modalIsOpen) return;
         this.appointment = e.detail;
        this.date = e.detail.datetime.replace(' ', 'T');
        this.open = true;
        window.modalIsOpen = true;
        document.body.classList.add('modal-open');
      });
      window.addEventListener('force-close-edit-modal', () => this.close());
    },
    close() {
      this.open = false;
      window.modalIsOpen = false;
      document.body.classList.remove('modal-open');
    },
    async save() {
      if (!this.date || !this.appointment.id) {
        return alert('Uzupełnij wszystkie pola');
      }
      try {
        const res = await fetch(`/admin/kalendarz/appointments/${this.appointment.id}/update-time`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
          },
          body: JSON.stringify({
            appointment_at: this.date,
          }),
        });
        if (!res.ok) throw new Error();
        this.close();
        window.location.reload();
      } catch {
        alert('Nie udało się zaktualizować rezerwacji');
      }
    },
  }
}
