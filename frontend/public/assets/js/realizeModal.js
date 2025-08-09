export function realizeModal() {
    return {
        open: false,
        appointment: {},
        history: [],
        loadedAllHistory: false,
        note_client: '',
        note_internal: '',
        amount_paid_pln: '',
        payment_method: '',
        service_description: '',
        products_used: '',
        init() {
            window.addEventListener('open-realize-modal', (e) => {
                if (window.modalIsOpen) return;
                const data = e.detail;
                this.appointment = data;
                this.note_client = data.note_client || '';
                this.note_internal = data.note_internal || '';
                this.amount_paid_pln = data.amount_paid_pln || data.price_pln;
                this.payment_method = data.payment_method || '';
                this.service_description = data.service_description || '';
                this.products_used = data.products_used || '';
                this.open = true;
                window.modalIsOpen = true;
                document.body.classList.add('modal-open');
                this.loadedAllHistory = false;
                this.loadHistory();
            });
            window.addEventListener('force-close-realize-modal', () =>
                this.close(),
            );
        },
        async loadHistory(all = false) {
            try {
                const url =
                    `/admin/kalendarz/appointments/${this.appointment.id}/history` +
                    (all ? '' : '?limit=5');
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    this.history = data.map((h) => {
                        const parts = [];
                        if (h.note_client)
                            parts.push('Zalecenia: ' + h.note_client);
                        if (h.note_internal)
                            parts.push('Notatka: ' + h.note_internal);
                        if (h.service_description)
                            parts.push('Opis: ' + h.service_description);
                        if (h.products_used)
                            parts.push('Produkty: ' + h.products_used);
                        return {
                            ...h,
                            tooltip:
                                parts.join('\n') ||
                                'Brak dodatkowych informacji',
                        };
                    });
                }
                this.loadedAllHistory = all;
            } catch {
                this.history = [];
            }
        },

        viewAllHistory() {
            this.loadHistory(true);
        },
        close() {
            this.open = false;
            window.modalIsOpen = false;
            document.body.classList.remove('modal-open');
        },
        async finalize() {
            try {
                const res = await fetch(
                    `/admin/kalendarz/appointments/${this.appointment.id}/finalize`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector(
                                'meta[name="csrf-token"]',
                            ).content,
                        },
                        body: JSON.stringify({
                            note_client: this.note_client,
                            note_internal: this.note_internal,
                            amount_paid_pln: this.amount_paid_pln,
                            payment_method: this.payment_method,
                            service_description: this.service_description,
                            products_used: this.products_used,
                        }),
                    },
                );
                if (!res.ok) throw new Error();
                this.close();
                window.location.reload();
            } catch {
                alert('Nie udało się zaktualizować rezerwacji');
            }
        },
    };
}
