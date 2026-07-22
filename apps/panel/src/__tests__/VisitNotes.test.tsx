import { render, screen } from '@testing-library/react';
import VisitNotes, {
    hasVisibleVisitNotes,
} from '@/components/client/VisitNotes';

describe('VisitNotes', () => {
    it('does not expose duration verification as a visible completed-visit note', () => {
        const value = {
            appointmentStatus: 'completed',
            onlineDurationNeedsVerification: true,
        };

        expect(hasVisibleVisitNotes(value)).toBe(false);

        render(<VisitNotes {...value} />);

        expect(
            screen.getByText('Brak notatek przy tej wizycie.'),
        ).toBeInTheDocument();
        expect(screen.queryByText('Weryfikacja czasu')).not.toBeInTheDocument();
    });

    it('keeps duration verification visible before finalization', () => {
        const value = {
            appointmentStatus: 'online_pending',
            onlineDurationNeedsVerification: true,
        };

        expect(hasVisibleVisitNotes(value)).toBe(true);

        render(<VisitNotes {...value} />);

        expect(screen.getByText('Weryfikacja czasu')).toBeInTheDocument();
        expect(
            screen.getByText('Salon potwierdzi łączny czas wizyty.'),
        ).toBeInTheDocument();
    });

    it('renders booking comment, staff recommendations, add-ons, and duration as separate sections', () => {
        const value = {
            appointmentStatus: 'completed',
            clientComment: 'proszę ciszej przy suszeniu',
            staffRecommendations: 'MYĆ I NIE PŁUKAĆ',
            onlineAddonsSummary:
                'Dermabrazja (+70 min), Botox na włosy (+180 min).',
            onlineTotalDurationMinutes: 250,
        };

        expect(hasVisibleVisitNotes(value)).toBe(true);

        render(<VisitNotes {...value} />);

        expect(screen.getByText('Komentarz do rezerwacji')).toBeInTheDocument();
        expect(
            screen.getByText('proszę ciszej przy suszeniu'),
        ).toBeInTheDocument();
        expect(screen.getByText('Zalecenia po wizycie')).toBeInTheDocument();
        expect(screen.getByText('MYĆ I NIE PŁUKAĆ')).toBeInTheDocument();
        expect(screen.getByText('Dodatkowe zabiegi')).toBeInTheDocument();
        expect(screen.getByText('Dermabrazja (+70 min)')).toBeInTheDocument();
        expect(
            screen.getByText('Botox na włosy (+180 min)'),
        ).toBeInTheDocument();
        expect(screen.getByText('Łączny czas')).toBeInTheDocument();
        expect(screen.getByText('250 min')).toBeInTheDocument();
    });
});
