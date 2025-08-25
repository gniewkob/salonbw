import { mockAdminLogin } from '../support/mockLogin';

describe('basic', () => {
    it('loads home', () => {
        cy.visit('/');
        cy.contains('Featured Services');
    });
});

describe('services crud', () => {
    beforeEach(() => {
        mockAdminLogin();
    });

    it('loads and creates service', () => {
        cy.intercept('GET', '/api/services*', { fixture: 'services.json' }).as(
            'getSvc',
        );
        cy.intercept('POST', '/api/services', { id: 3, name: 'New' }).as(
            'createSvc',
        );
        cy.visit('/services');
        cy.wait('@getSvc');
        cy.contains('Add Service').click();
        cy.get('input[placeholder="Name"]').type('New');
        cy.contains('button', 'Save').click();
        cy.wait('@createSvc');
        cy.contains('New');
        cy.contains('Service created');
    });
});
