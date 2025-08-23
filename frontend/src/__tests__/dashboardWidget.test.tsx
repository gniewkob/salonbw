import { render, screen } from '@testing-library/react';
import DashboardWidget from '@/components/DashboardWidget';

describe('DashboardWidget', () => {
    it('renders value', () => {
        render(<DashboardWidget label="Test" value={5} />);
        expect(screen.getByText('Test')).toBeInTheDocument();
        expect(screen.getByTestId('value').textContent).toBe('5');
    });

    it('shows loader', () => {
        render(<DashboardWidget label="X" value={0} loading />);
        expect(screen.getByRole('status')).toBeInTheDocument();
    });
});
