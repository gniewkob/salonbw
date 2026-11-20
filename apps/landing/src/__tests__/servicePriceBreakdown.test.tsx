import { fireEvent, render, screen } from '@testing-library/react';
import type { Service, ServiceVariant } from '@/types';
import ServicePriceBreakdown, {
    servicePriceDetailRows,
} from '@/components/ServicePriceBreakdown';

function service(
    id: number,
    name: string,
    price: number,
    duration: number,
    variants?: ServiceVariant[],
): Service {
    return {
        id,
        name,
        price,
        duration,
        priceType: 'fixed',
        isActive: true,
        onlineBooking: true,
        sortOrder: id,
        variants,
    };
}

function variant(
    id: number,
    name: string,
    price: number,
    duration: number,
    isActive = true,
): ServiceVariant {
    return {
        id,
        serviceId: 100,
        name,
        price,
        duration,
        priceType: 'fixed',
        sortOrder: id,
        isActive,
    };
}

describe('ServicePriceBreakdown', () => {
    it('reveals real flat Booksy service options and never invents prices', () => {
        const services = [
            service(1, 'Strzyżenie damskie – włosy krótkie', 120, 45),
            service(2, 'Strzyżenie damskie – włosy długie', 190, 75),
        ];

        render(
            <ServicePriceBreakdown
                services={services}
                fromLabel="od"
                label="Sprawdź warianty i ceny"
            />,
        );

        const summary = screen.getByText('Sprawdź warianty i ceny');
        const details = summary.closest('details');
        expect(details).not.toBeNull();
        expect(details).not.toHaveAttribute('open');

        fireEvent.click(summary);
        expect(details).toHaveAttribute('open');
        expect(screen.getByText('Strzyżenie damskie – włosy krótkie')).toBeInTheDocument();
        expect(screen.getByText('Strzyżenie damskie – włosy długie')).toBeInTheDocument();
        expect(screen.getByText(/120,00\s*zł/)).toBeInTheDocument();
        expect(screen.getByText(/190,00\s*zł/)).toBeInTheDocument();
        expect(screen.getByText('45 min')).toBeInTheDocument();
        expect(screen.getByText('75 min')).toBeInTheDocument();

        fireEvent.click(summary);
        expect(details).not.toHaveAttribute('open');
    });

    it('books the real flat Booksy service ID for the selected option', () => {
        const onBookService = jest.fn();
        const services = [
            service(11, 'Strzyżenie damskie – włosy krótkie', 120, 45),
            service(12, 'Strzyżenie damskie – włosy długie', 190, 75),
        ];

        render(
            <ServicePriceBreakdown
                services={services}
                fromLabel="od"
                label="Sprawdź warianty i ceny"
                bookLabel="Umów"
                onBookService={onBookService}
            />,
        );

        fireEvent.click(screen.getByText('Sprawdź warianty i ceny'));
        fireEvent.click(
            screen.getByRole('button', {
                name: 'Umów: Strzyżenie damskie – włosy długie',
            }),
        );
        expect(onBookService).toHaveBeenCalledTimes(1);
        expect(onBookService).toHaveBeenCalledWith({
            id: 12,
            name: 'Strzyżenie damskie – włosy długie',
            priceLabel: expect.stringMatching(/190,00\s*zł/),
            duration: '75 min',
        });
    });

    it('does not offer direct booking for a service disabled in online booking', () => {
        const onBookService = jest.fn();
        const offlineService = {
            ...service(70, 'Modelowanie – okazjonalne', 150, 45),
            onlineBooking: false,
        };
        render(
            <ServicePriceBreakdown
                services={[
                    service(69, 'Modelowanie – klasyczne', 95, 30),
                    offlineService,
                ]}
                fromLabel="od"
                label="Sprawdź warianty i ceny"
                bookLabel="Umów"
                onBookService={onBookService}
            />,
        );

        fireEvent.click(screen.getByText('Sprawdź warianty i ceny'));
        expect(
            screen.queryByRole('button', {
                name: 'Umów: Modelowanie – okazjonalne',
            }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole('button', {
                name: 'Umów: Modelowanie – klasyczne',
            }),
        ).toBeInTheDocument();
    });

    it('does not pass nested variant IDs as bookable service IDs', () => {
        const onBookService = jest.fn();
        render(
            <ServicePriceBreakdown
                services={[
                    service(100, 'Koloryzacja', 280, 90, [
                        variant(101, 'włosy krótkie', 280, 90),
                        variant(102, 'włosy długie', 390, 150),
                    ]),
                ]}
                fromLabel="od"
                label="Sprawdź warianty i ceny"
                bookLabel="Umów"
                wizardHint="Wariant usługi wybierzesz podczas rezerwacji."
                onBookService={onBookService}
            />,
        );

        fireEvent.click(screen.getByText('Sprawdź warianty i ceny'));
        expect(screen.queryByRole('button', { name: /^Umów:/ })).not.toBeInTheDocument();
        expect(screen.getByText('Wariant usługi wybierzesz podczas rezerwacji.')).toBeInTheDocument();
        expect(onBookService).not.toHaveBeenCalled();
    });

    it('uses active nested variants, preserving names, prices and durations', () => {
        const entries = servicePriceDetailRows(
            [
                service(100, 'Koloryzacja', 280, 90, [
                    variant(101, 'włosy krótkie', 280, 90),
                    variant(102, 'włosy długie', 390, 150),
                    variant(103, 'wycofany wariant', 50, 30, false),
                ]),
            ],
            'od',
        );

        expect(entries).toHaveLength(2);
        expect(entries.map((x) => x.name)).toEqual([
            'Koloryzacja — włosy krótkie',
            'Koloryzacja — włosy długie',
        ]);
        expect(entries.map((x) => x.durationLabel)).toEqual([
            '90 min',
            '150 min',
        ]);
        expect(entries.some((x) => x.name.includes('wycofany'))).toBe(false);
    });

    it('does not add redundant disclosure for a single fixed-price service', () => {
        const { container } = render(
            <ServicePriceBreakdown
                services={[service(50, 'Modelowanie', 85, 30)]}
                fromLabel="od"
                label="Sprawdź warianty i ceny"
            />,
        );

        expect(container).toBeEmptyDOMElement();
    });

    it('respects source priceType when a detailed variant has a from-price', () => {
        const starting = {
            ...variant(105, 'konsultacja', 180, 60),
            priceType: 'from' as const,
        };
        const entries = servicePriceDetailRows(
            [service(100, 'Pielęgnacja', 180, 60, [starting])],
            'od',
        );

        expect(entries).toHaveLength(1);
        expect(entries[0]!.priceLabel).toMatch(/^od\s+180,00\s*zł/);
    });
});
