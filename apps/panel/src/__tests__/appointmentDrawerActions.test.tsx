import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import ActionsSection from '@/components/calendar/appointment-drawer/ActionsSection';
import type { Appointment } from '@/types';

jest.mock('@/components/ConfirmModal', () => ({
    __esModule: true,
    default: () => null,
}));

function actionsProps(): ComponentProps<typeof ActionsSection> {
    return {
        mode: 'create',
        saving: false,
        canSaveCreate: true,
        canSaveEdit: true,
        startTime: '2026-11-19T20:00:00.000Z',
        appointment: null,
        isOnlinePending: false,
        isRescheduledPending: false,
        canConfirm: false,
        canStart: false,
        canNoShow: false,
        canCancel: false,
        canComplete: false,
        customerAlertSeverity: undefined,
        onClose: jest.fn(),
        handleCreate: jest.fn(),
        handleUpdate: jest.fn(),
        handleCancel: jest.fn(),
        handleStatusChange: jest.fn(),
        setFinalizationOpen: jest.fn(),
        isMobile: false,
    };
}

describe('appointment drawer actions', () => {
    it('shows only one create action on mobile and calls it once', () => {
        const props = { ...actionsProps(), isMobile: true };
        render(<ActionsSection {...props} />);

        expect(screen.getByRole('button', { name: 'Utwórz' })).toBeEnabled();
        expect(
            screen.queryByRole('button', { name: 'Utwórz wizytę' }),
        ).not.toBeInTheDocument();
        expect(screen.queryByText('Akcje')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Utwórz' }));
        expect(props.handleCreate).toHaveBeenCalledTimes(1);
        fireEvent.click(screen.getByRole('button', { name: 'Anuluj' }));
        expect(props.onClose).toHaveBeenCalledTimes(1);
    });

    it('keeps one inline create action on desktop', () => {
        const props = actionsProps();
        render(<ActionsSection {...props} />);

        expect(screen.getByText('Akcje')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Utwórz wizytę' }),
        ).toBeEnabled();
        expect(
            screen.queryByRole('button', { name: 'Utwórz' }),
        ).not.toBeInTheDocument();
    });

    it('preserves the mobile overlap action label and disabled state', () => {
        const props = {
            ...actionsProps(),
            isMobile: true,
            canSaveCreate: false,
            createLabel: 'Dodaj mimo to',
        };
        render(<ActionsSection {...props} />);

        expect(
            screen.getByRole('button', { name: 'Dodaj mimo to' }),
        ).toBeDisabled();
        expect(
            screen.queryByRole('button', { name: 'Utwórz wizytę' }),
        ).not.toBeInTheDocument();
    });

    it('keeps edit-only secondary actions on mobile but just one save action', () => {
        const props = {
            ...actionsProps(),
            mode: 'edit' as const,
            isMobile: true,
            appointment: { id: 42 } as Appointment,
            canConfirm: true,
            editLabel: 'Zapisz mimo konfliktu',
        };
        render(<ActionsSection {...props} />);

        expect(
            screen.getByRole('button', { name: 'Zapisz mimo konfliktu' }),
        ).toBeEnabled();
        expect(
            screen.queryByRole('button', { name: 'Zapisz zmiany' }),
        ).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Potwierdź' })).toBeEnabled();
        fireEvent.click(
            screen.getByRole('button', { name: 'Zapisz mimo konfliktu' }),
        );
        expect(props.handleUpdate).toHaveBeenCalledTimes(1);
    });

    it('keeps the desktop edit save action', () => {
        const props = {
            ...actionsProps(),
            mode: 'edit' as const,
            appointment: { id: 42 } as Appointment,
        };
        render(<ActionsSection {...props} />);

        expect(
            screen.getByRole('button', { name: 'Zapisz zmiany' }),
        ).toBeEnabled();
        expect(
            screen.queryByRole('button', { name: 'Zapisz' }),
        ).not.toBeInTheDocument();
    });

    it('omits an empty actions card when mobile editing has no secondary actions', () => {
        const props = {
            ...actionsProps(),
            mode: 'edit' as const,
            isMobile: true,
            appointment: { id: 42 } as Appointment,
        };
        render(<ActionsSection {...props} />);

        expect(screen.getByRole('button', { name: 'Zapisz' })).toBeEnabled();
        expect(screen.queryByText('Akcje')).not.toBeInTheDocument();
    });
});
