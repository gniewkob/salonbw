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

	close() {
	  this.open = false;
	  window.modalIsOpen = false; // odblokuj
	  document.body.classList.remove('modal-open');
	}
  }
}
