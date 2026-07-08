// "YYYY-MM-DD" z LOKALNEJ daty. NIGDY nie używać
// `toISOString().slice(0,10)` do dat lokalnych — toISOString konwertuje na
// UTC, więc w PL (UTC+1/+2) między północą a 01:00/02:00 zwraca POPRZEDNI
// dzień (klasa buga naprawiona w day-stepperze rezerwacji, commit 611ca89).
export function toISODateLocal(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export function todayISODate(): string {
    return toISODateLocal(new Date());
}
