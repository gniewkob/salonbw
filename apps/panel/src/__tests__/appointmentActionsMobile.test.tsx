import { render, screen } from '@testing-library/react';
import ActionsSection from '@/components/calendar/appointment-drawer/ActionsSection';

function renderActions(preferMobileFooter: boolean, isMobile = true) {
    return render(
        <ActionsSection
            mode="create"
            saving={false}
            canSaveCreate
            startTime="2026-11-09T10:00"
            appointment={null}
            isOnlinePending={false}
            isRescheduledPending={false}
            canConfirm={false}
            canStart={false}
            canNoShow={false}
            canCancel={false}
            canComplete={false}
            customerAlertSeverity={undefined}
            onClose={jest.fn()}
            handleCreate={jest.fn()}
            handleUpdate={jest.fn()}
            handleCancel={jest.fn()}
            handleStatusChange={jest.fn()}
            setFinalizationOpen={jest.fn()}
            isMobile={isMobile}
            preferMobileFooter={preferMobileFooter}
        />,
    );
}

describe('Appointment actions on a phone', () => {
    it('shows exactly one primary create action in V18 mobile footer', () => {
        renderActions(true);
        expect(
            screen.getByRole('button', { name: 'Utwórz', exact: true }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Utwórz wizytę' }),
        ).not.toBeInTheDocument();
    });

    it('keeps legacy mobile and V18 desktop inline create actions', () => {
        const { unmount } = renderActions(false);
        expect(
            screen.getByRole('button', { name: 'Utwórz wizytę' }),
        ).toBeInTheDocument();
        unmount();

        renderActions(true, false);
        expect(
            screen.getByRole('button', { name: 'Utwórz wizytę' }),
        ).toBeInTheDocument();
    });
});
