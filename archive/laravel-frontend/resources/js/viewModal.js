export function viewModal() {
  return {
        open: false,
        appointment: {},

	init() {
          window.addEventListener('open-view-modal', e => {
                if (window.modalIsOpen) return;
                this.appointment = e.detail;
                this.open = true;
                window.modalIsOpen = true; // modal otwarty
                document.body.classList.add('modal-open');
          });
        },

        edit() {
          const data = this.appointment;
          this.close();
          window.dispatchEvent(new CustomEvent('open-edit-full-modal', { detail: data }));
        },

        realize() {
          const data = this.appointment;
          this.close();
          window.dispatchEvent(new CustomEvent('open-realize-modal', { detail: data }));
        },

	close() {
	  this.open = false;
	  window.modalIsOpen = false; // odblokuj
	  document.body.classList.remove('modal-open');
	}
  }
}
