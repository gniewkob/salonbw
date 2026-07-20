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
});
