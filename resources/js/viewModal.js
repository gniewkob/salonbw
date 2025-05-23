export function viewModal() {
  return {
	open: false,
	appointment: {},

	init() {
	  window.addEventListener('open-view-modal', e => {
		this.appointment = e.detail;
		this.open = true;
		// Dodaj klasę na body przy otwarciu
		document.body.classList.add('modal-open');
	  });
	},

	close() {
	  this.open = false;
	  // Usuń klasę z body przy zamykaniu
	  document.body.classList.remove('modal-open');
	}
  }
}
