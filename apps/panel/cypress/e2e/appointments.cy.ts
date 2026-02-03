import { mockClientLogin } from '../support/mockLogin';

describe('appointments', () => {
    beforeEach(() => {
        mockClientLogin();
        cy.intercept('GET', 'http://localhost:3001/services*', {
            fixture: 'services.json',
        }).as('getServices');
        cy.intercept('GET', 'http://localhost:3001/appointments*', []).as(
            'getAppointments',
        );
    });

    it('loads appointment calendar successfully', () => {
        cy.visit('/appointments');
        cy.wait('@profile');
        cy.wait('@getServices');
        cy.wait('@getAppointments');

        // Wait for calendar to be rendered
        cy.get('.fc-toolbar', { timeout: 10000 }).should('exist');
        cy.get('.fc-timegrid-slot, .fc-daygrid-day').should('exist');

        // Verify the calendar toolbar is loaded
        cy.get('.fc-toolbar-title').should('be.visible');
        // Verify calendar grid is visible
        cy.get('.fc-timegrid, .fc-daygrid').should('be.visible');
    });
});
