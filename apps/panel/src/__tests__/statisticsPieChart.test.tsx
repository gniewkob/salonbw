import { render, screen } from '@testing-library/react';
import StatisticsPieChart from '@/components/statistics/StatisticsPieChart';

describe('StatisticsPieChart', () => {
    it('shows an empty state instead of a full black disc when there is no data', () => {
        render(
            <StatisticsPieChart
                width={300}
                height={200}
                data={[{ label: 'gotówka', value: 0, color: '#0d0d0d' }]}
            />,
        );

        expect(screen.getByText(/Brak danych/i)).toBeInTheDocument();
        expect(document.querySelector('svg')).toBeNull();
    });

    it('renders the chart when there is data', () => {
        render(
            <StatisticsPieChart
                width={300}
                height={200}
                data={[
                    { label: 'gotówka', value: 70, color: '#0d0d0d' },
                    { label: 'karta', value: 30, color: '#6e7278' },
                ]}
            />,
        );

        expect(screen.queryByText(/Brak danych/i)).not.toBeInTheDocument();
        expect(document.querySelector('svg')).not.toBeNull();
    });
});
