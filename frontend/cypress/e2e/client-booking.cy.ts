import { mockClientLogin } from '../support/mockLogin';

describe('client booking flow', () => {
    beforeEach(() => {
        mockClientLogin();
        cy.intercept('GET', '**/api/services*', {
            fixture: 'services.json',
        }).as('getServices');
        cy.intercept('GET', '**/api/appointments*', []).as('getAppointments');
    });

    it('books an appointment from calendar', () => {
        cy.visit('/appointments');
        cy.wait('@profile');
        cy.wait('@getServices');
        cy.wait('@getAppointments');

        // Click on a time slot to open the modal
        cy.get('.fc-timegrid-slot, .fc-daygrid-day', { timeout: 10000 })
            .first()
            .click();

        // Intercept create request
        cy.intercept('POST', '**/api/appointments', {
            statusCode: 201,
            body: { id: 101, startTime: '2025-01-01T10:00:00.000Z' },
        }).as('createAppt');

        // Fill date-time and save (service defaults to first option)
        const dt = '2025-01-01T10:00';
        cy.get('input[type="datetime-local"]').clear({ force: true }).type(dt, {
            force: true,
        });
        cy.contains('button', 'Save').click();
        cy.wait('@createAppt');
        cy.contains('Appointment created');
    });
});
