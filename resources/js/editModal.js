1  export function editModal() {
2    return {
3      open: false,
4      appointment: {},
5      date: '',
6      init() {
7        window.addEventListener('open-edit-modal', e => {
8          if (window.modalIsOpen) return;
9          this.appointment = e.detail;
10         this.date = e.detail.datetime.replace(' ', 'T');
11         this.open = true;
12         window.modalIsOpen = true;
13         document.body.classList.add('modal-open');
14       });
15       window.addEventListener('force-close-edit-modal', () => this.close());
16     },
17     close() {
18       this.open = false;
19       window.modalIsOpen = false;
20       document.body.classList.remove('modal-open');
21     },
22     async save() {
23       if (!this.date || !this.appointment.id) {
24         return alert('Uzupełnij wszystkie pola');
25       }
26       try {
27         const res = await fetch(`/admin/kalendarz/appointments/${this.appointment.id}/update-time`, {
28           method: 'POST',
29           headers: {
30             'Content-Type': 'application/json',
31             'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
32           },
33           body: JSON.stringify({
34             appointment_at: this.date,
35           }),
36         });
37         if (!res.ok) throw new Error();
38         this.close();
39         window.location.reload();
40       } catch {
41         alert('Nie udało się zaktualizować rezerwacji');
42       }
43     },
44   }
45 }
