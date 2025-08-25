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
        cy.intercept('GET', '/api/services*', { fixture: 'services.json' });
        cy.intercept('POST', '/api/services', { id: 3, name: 'New' });
        cy.visit('/services');
        cy.contains('Cut');
        cy.contains('Add Service').click();
        cy.get('input[placeholder="Name"]').type('New');
        cy.contains('button', 'Save').click();
        cy.contains('Service created');
        cy.contains('New');
    });
});
