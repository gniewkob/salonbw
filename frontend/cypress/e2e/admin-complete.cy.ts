import { mockAdminLogin } from '../support/mockLogin';

describe('admin completes appointment', () => {
    it('opens event details and completes it', () => {
        mockAdminLogin();

        // Freeze time so the event is in current view
        const now = new Date('2025-01-01T09:00:00.000Z');
        cy.clock(now.getTime(), ['Date']);

        cy.intercept('GET', '**/api/services*', {
            statusCode: 200,
            body: [{ id: 1, name: 'Cut', duration: 30, price: 10 }],
        }).as('getServices');
        cy.intercept('GET', '**/api/users?role=employee*', {
            statusCode: 200,
            body: [{ id: 2, name: 'Bob' }],
        }).as('getEmployees');
        cy.intercept('GET', '**/api/users?role=client*', {
            statusCode: 200,
            body: [{ id: 1, name: 'Alice' }],
        }).as('getClients');
        cy.intercept('GET', '**/api/appointments*', {
            statusCode: 200,
            body: [
                {
                    id: 99,
                    startTime: '2025-01-01T10:00:00.000Z',
                    client: { id: 1, name: 'Alice' },
                    service: { id: 1, name: 'Cut' },
                    employee: { id: 2, name: 'Bob' },
                    paymentStatus: 'scheduled',
                },
            ],
        }).as('getAppointments');

        cy.visit('/dashboard/admin/scheduler');
        cy.wait('@profile');
        cy.wait('@getServices');
        cy.wait('@getEmployees');
        cy.wait('@getClients');
        cy.wait('@getAppointments');

        // Ensure calendar is visible and event rendered
        cy.get('.fc-timegrid, .fc-daygrid', { timeout: 10000 }).should(
            'be.visible',
        );
        cy.contains('Alice').click({ force: true });

        // Complete the appointment
        cy.intercept('PATCH', '**/api/appointments/99/complete', {
            statusCode: 200,
            body: { id: 99, paymentStatus: 'completed' },
        }).as('complete');
        cy.contains('button', 'Complete').click();
        cy.wait('@complete');
        cy.contains('Appointment completed');
    });
});
