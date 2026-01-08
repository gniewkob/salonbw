import { capitalizeFirst } from '../utils/string';

describe('capitalizeFirst', () => {
    it('capitalizes the first letter of a word', () => {
        expect(capitalizeFirst('hello')).toBe('Hello');
    });

    it('returns empty string when given empty input', () => {
        expect(capitalizeFirst('')).toBe('');
    });
});
