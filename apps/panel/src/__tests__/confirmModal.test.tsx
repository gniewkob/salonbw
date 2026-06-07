import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ConfirmModal from '@/components/ConfirmModal';

describe('ConfirmModal', () => {
    it('renders title and message when open', () => {
        render(
            <ConfirmModal
                open
                title="Usuń element"
                message="Czy na pewno chcesz usunąć?"
                onConfirm={() => {}}
                onCancel={() => {}}
            />,
        );

        expect(screen.getByText('Usuń element')).toBeInTheDocument();
        expect(
            screen.getByText('Czy na pewno chcesz usunąć?'),
        ).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        render(
            <ConfirmModal
                open={false}
                title="Usuń element"
                onConfirm={() => {}}
                onCancel={() => {}}
            />,
        );

        expect(screen.queryByText('Usuń element')).not.toBeInTheDocument();
    });

    it('calls onConfirm when confirm button clicked', () => {
        const onConfirm = jest.fn();
        render(
            <ConfirmModal
                open
                title="Usuń"
                confirmLabel="Usuń element"
                onConfirm={onConfirm}
                onCancel={() => {}}
            />,
        );

        fireEvent.click(screen.getByText('Usuń element'));
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when cancel button clicked', () => {
        const onCancel = jest.fn();
        render(
            <ConfirmModal
                open
                title="Usuń"
                onConfirm={() => {}}
                onCancel={onCancel}
            />,
        );

        fireEvent.click(screen.getByText('Anuluj'));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when Escape key pressed', () => {
        const onCancel = jest.fn();
        render(
            <ConfirmModal
                open
                title="Usuń"
                onConfirm={() => {}}
                onCancel={onCancel}
            />,
        );

        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('has proper ARIA attributes', () => {
        render(
            <ConfirmModal
                open
                title="Test dialog"
                onConfirm={() => {}}
                onCancel={() => {}}
            />,
        );

        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute(
            'aria-labelledby',
            'confirm-modal-title',
        );
    });

    it('traps Tab focus between cancel and confirm buttons', () => {
        render(
            <ConfirmModal
                open
                title="Potwierdź akcję"
                confirmLabel="Usuń element"
                onConfirm={() => {}}
                onCancel={() => {}}
            />,
        );

        const cancelBtn = screen.getByRole('button', { name: 'Anuluj' });
        const confirmBtn = screen.getByRole('button', { name: 'Usuń element' });

        confirmBtn.focus();
        fireEvent.keyDown(document, { key: 'Tab' });
        expect(document.activeElement).toBe(cancelBtn);

        cancelBtn.focus();
        fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
        expect(document.activeElement).toBe(confirmBtn);
    });
});
