import { pluralize, selectPluralForm } from '@/utils/plural';

const PL = { one: 'usługa', few: 'usługi', many: 'usług' };
const EN = { one: 'service', few: 'services', many: 'services' };

describe('Polish plural forms', () => {
    it('uses the singular only for exactly one', () => {
        expect(selectPluralForm(1, PL)).toBe('usługa');
        expect(selectPluralForm(0, PL)).toBe('usług');
    });

    it('uses the "few" form for 2-4 and the same endings above 20', () => {
        for (const n of [2, 3, 4, 22, 23, 24, 102, 104]) {
            expect(selectPluralForm(n, PL)).toBe('usługi');
        }
    });

    it('uses the genitive form for 5+ — the case that shipped wrong', () => {
        for (const n of [5, 7, 9, 15, 25, 100]) {
            expect(selectPluralForm(n, PL)).toBe('usług');
        }
    });

    it('keeps 12-14 on the genitive form despite ending in 2-4', () => {
        for (const n of [12, 13, 14, 112, 113, 114]) {
            expect(selectPluralForm(n, PL)).toBe('usług');
        }
    });

    it('degenerates to two forms when few and many are the same word', () => {
        expect(selectPluralForm(1, EN)).toBe('service');
        expect(selectPluralForm(3, EN)).toBe('services');
        expect(selectPluralForm(15, EN)).toBe('services');
    });

    it('renders the count next to the chosen form', () => {
        expect(pluralize(15, PL)).toBe('15 usług');
        expect(pluralize(3, PL)).toBe('3 usługi');
        expect(pluralize(1, PL)).toBe('1 usługa');
    });
});
