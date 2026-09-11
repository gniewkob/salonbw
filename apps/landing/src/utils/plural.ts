/**
 * Plural forms for counted nouns.
 *
 * Polish needs three: "1 usługa", "2 usługi", "5 usług" — with the trap that
 * 12–14 take the same form as 5+, so "12 usługi" is wrong while "22 usługi"
 * is right. English and German need two, which this covers by passing the
 * same word as `few` and `many`.
 */
export interface PluralForms {
    one: string;
    few: string;
    many: string;
}

export function selectPluralForm(count: number, forms: PluralForms): string {
    const n = Math.abs(Math.trunc(count));
    if (n === 1) return forms.one;
    const lastTwo = n % 100;
    if (lastTwo >= 12 && lastTwo <= 14) return forms.many;
    const last = n % 10;
    if (last >= 2 && last <= 4) return forms.few;
    return forms.many;
}

export function pluralize(count: number, forms: PluralForms): string {
    return `${count} ${selectPluralForm(count, forms)}`;
}
