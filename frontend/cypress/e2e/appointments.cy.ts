import { mockClientLogin } from '../support/mockLogin';

describe('appointments', () => {
    beforeEach(() => {
        mockClientLogin();
        cy.intercept('GET', '/api/services*', { fixture: 'services.json' }).as(
            'getServices',
        );
        cy.intercept('GET', '/api/appointments*', []).as('getAppointments');
    });

    it('selects service from Radix Select', () => {
        cy.visit('/appointments');
        cy.wait('@profile');
        cy.wait('@getServices');
        cy.wait('@getAppointments');
        cy.get('[data-date]').first().click({ force: true });
        cy.get('form [data-testid="service-select"]', { timeout: 10000 })
            .should('be.visible')
            .click({ force: true });
        cy.get('[data-radix-collection-item]').contains('Color').click();
        cy.get('[data-testid="service-select"]').contains('Color');
    });
});

