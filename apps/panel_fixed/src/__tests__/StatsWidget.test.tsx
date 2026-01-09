import { render, screen } from '@testing-library/react';
import StatsWidget from '@/components/StatsWidget';

describe('StatsWidget', () => {
    it('renders value', () => {
        render(<StatsWidget title="Test" value={5} />);
        expect(screen.getByText('Test')).toBeInTheDocument();
        expect(screen.getByTestId('value').textContent).toBe('5');
    });

    it('shows loader', () => {
        render(<StatsWidget title="X" value={0} loading />);
        expect(screen.getByRole('status')).toBeInTheDocument();
    });
});
