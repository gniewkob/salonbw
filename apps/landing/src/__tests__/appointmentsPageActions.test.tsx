import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import AppointmentsPage from '@/pages/appointments';
import type ReactType from 'react';

// Mock calendar with buttons to invoke handlers
jest.mock('@fullcalendar/react', () => {
    const React: typeof ReactType = require('react');
    type MockProps = {
        dateClick?: (a: { dateStr: string }) => void;
        eventClick?: (a: { event: { id: string; startStr: string } }) => void;
        eventDrop?: (a: {
            event: { id: string; start: Date };
            revert: () => void;
        }) => void;
        __revert?: () => void;
    };
    const MockFullCalendar: React.FC<MockProps> = (props) => (
        <div>
            <button
                onClick={() =>
                    props.dateClick?.({ dateStr: '2025-01-02T09:00' })
                }
            >
                mock-date
            </button>
            <button
                onClick={() =>
                    props.eventClick?.({
                        event: { id: '1', startStr: '2025-01-01T10:00' },
                    })
                }
            >
                mock-event-click
            </button>
            <button
                onClick={() =>
                    props.eventDrop?.({
                        event: {
                            id: '1',
                            start: new Date('2025-01-03T10:00:00Z'),
                        },
                        revert: props.__revert || jest.fn(),
                    })
                }
            >
                mock-drop
            </button>
        </div>
    );
    MockFullCalendar.displayName = 'MockFullCalendar';
    return MockFullCalendar;
});
jest.mock('@fullcalendar/daygrid', () => ({}));
jest.mock('@fullcalendar/timegrid', () => ({}));
jest.mock('@fullcalendar/interaction', () => ({}));
// Force next/dynamic to render mocked module immediately in tests
jest.mock('next/dynamic', () => () => {
    const React: typeof ReactType = require('react');
    const Dynamic: React.FC<Record<string, unknown>> = (props) => {
        const Mod = require('@fullcalendar/react');
        const C = Mod.default || Mod;
        return <C {...(props as Record<string, unknown>)} />;
    };
    Dynamic.displayName = 'MockDynamic';
    return Dynamic;
});

jest.mock('@/hooks/useAppointments', () => ({
    useAppointments: () => ({
        data: [
            {
                id: 1,
                startTime: '2025-01-01T10:00:00Z',
                client: { id: 1, name: 'Alice' },
            },
        ],
        loading: false,
        error: null,
    }),
    useMyAppointments: () => ({
        data: [
            {
                id: 1,
                startTime: '2025-01-01T10:00:00Z',
                client: { id: 1, name: 'Alice' },
            },
        ],
        loading: false,
        error: null,
    }),
}));
jest.mock('@/hooks/useServices', () => ({
    useServices: () => ({
        data: [{ id: 1, name: 'Cut', duration: 30, price: 10 }],
        loading: false,
    }),
}));

const update = jest.fn();
const create = jest.fn();
jest.mock('@/api/appointments', () => ({
    useAppointmentsApi: () => ({ create: create, update: update }),
}));

jest.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        role: 'client',
        isAuthenticated: true,
        initialized: true,
    }),
}));
jest.mock('next/router', () => ({ useRouter: () => ({ pathname: '/' }) }));

describe('AppointmentsPage actions', () => {
    beforeEach(() => {
        update.mockReset();
        create.mockReset();
    });

    it('updates appointment via modal submit (edit path)', async () => {
        render(<AppointmentsPage />);
        // Open edit by clicking event
        fireEvent.click(screen.getByText('mock-event-click'));
        // Change date-time and save
        const input = await screen.findByDisplayValue('2025-01-01T10:00');
        fireEvent.change(input, { target: { value: '2025-01-04T11:00' } });
        fireEvent.click(screen.getByRole('button', { name: /save/i }));
        await waitFor(() => expect(update).toHaveBeenCalled());
        expect(update.mock.calls[0][0]).toBe(1);
    });

    it('handles drop conflict with alert and revert', async () => {
        const originalAlert = window.alert;
        const alertMock = jest.fn();
        // @ts-expect-error override
        window.alert = alertMock;
        update.mockRejectedValueOnce(new Error('conflict'));
        render(<AppointmentsPage />);
        fireEvent.click(screen.getByText('mock-drop'));
        await waitFor(() => expect(alertMock).toHaveBeenCalled());
        // restore
        window.alert = originalAlert;
    });
});
