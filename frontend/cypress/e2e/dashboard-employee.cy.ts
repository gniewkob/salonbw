import { mockEmployeeLogin } from '../support/mockLogin';

describe('employee dashboard navigation', () => {
    beforeEach(() => {
        mockEmployeeLogin();
        cy.intercept('GET', '/api/dashboard', { fixture: 'dashboard.json' }).as(
            'dashboard',
        );
    });

    it('redirects to employee dashboard and shows widgets', () => {
        cy.visit('/dashboard');
        cy.wait('@dashboard');
        cy.url().should('include', '/dashboard/employee');
        cy.contains('Today Appointments');
        cy.contains('Clients');
    });

    it('navigates to clients via sidebar', () => {
        cy.visit('/dashboard/employee');
        cy.wait('@dashboard');
        cy.contains('Clients').click();
        cy.url().should('include', '/clients');
    });
});

describe('employee dashboard clients crud', () => {
    beforeEach(() => {
        mockEmployeeLogin();
        cy.intercept('GET', '/api/clients', { fixture: 'clients.json' }).as(
            'getClients',
        );
    });

    it('creates a client', () => {
        cy.intercept('POST', '/api/clients', { id: 3, name: 'New' }).as(
            'createClient',
        );
        cy.visit('/clients');
        cy.wait('@getClients');
        cy.contains('Add Client').click();
        cy.get('input[placeholder="Name"]').type('New');
        cy.contains('button', 'Save').click();
        cy.wait('@createClient');
        cy.contains('New');
    });
});

describe('employee dashboard permissions', () => {
    it('redirects anonymous user', () => {
        cy.intercept('GET', '/api/profile', { statusCode: 401 });
        cy.on('uncaught:exception', () => false);
        cy.visit('/dashboard/employee');
        cy.url().should('include', '/auth/login');
    });
});
