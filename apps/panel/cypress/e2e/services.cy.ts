import { mockAdminLogin } from '../support/mockLogin';

describe('services crud', () => {
    beforeEach(() => {
        mockAdminLogin();
    });

    it('loads and creates service', () => {
        cy.intercept('GET', 'http://localhost:3001/services*', {
            fixture: 'services.json',
        }).as('getSvc');
        cy.intercept('POST', 'http://localhost:3001/services', {
            id: 3,
            name: 'New',
        }).as('createSvc');
        cy.visit('/dashboard/services');
        cy.wait('@profile');
        cy.wait('@getSvc');
        cy.contains('Cut');
        cy.contains('Add Service', { timeout: 10000 })
            .should('be.visible')
            .click();
        cy.get('input[placeholder="Name"]').type('New');
        cy.contains('button', 'Save').click();
        cy.wait('@createSvc');
        cy.contains('Service created');
        cy.get('table').should('contain', 'New');
    });
});
