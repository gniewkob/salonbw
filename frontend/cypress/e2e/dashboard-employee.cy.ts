import { mockEmployeeLogin } from '../support/mockLogin';

describe('employee dashboard navigation', () => {
    beforeEach(() => {
        mockEmployeeLogin();
        cy.intercept('GET', '**/api/appointments/me', []).as('getMine');
    });

    it('redirects to employee dashboard and shows widgets', () => {
        cy.visit('/dashboard');
        cy.wait('@profile');
        cy.wait('@getMine');
        cy.url().should('include', '/dashboard/employee');
        // Calendar toolbar and grid should be visible
        cy.get('.fc-toolbar', { timeout: 10000 }).should('exist');
        cy.get('.fc-timegrid, .fc-daygrid', { timeout: 10000 }).should(
            'be.visible',
        );
    });

    it('navigates to clients via sidebar', () => {
        cy.visit('/dashboard/employee');
        cy.wait('@profile');
        cy.wait('@getMine');
        cy.intercept('GET', '**/api/clients', {
            fixture: 'clients.json',
        }).as('getClients');
        cy.get('[data-testid="nav-clients"]', { timeout: 10000 }).as(
            'navClients',
        );
        cy.get('@navClients').click();
        cy.wait('@getClients');
        cy.url().should('include', '/clients');
        cy.get('table').should('be.visible');
    });
});

describe('employee dashboard clients access', () => {
    it('redirects from clients page to employee dashboard', () => {
        mockEmployeeLogin();
        cy.visit('/clients');
        cy.wait('@profile');
        cy.url().should('include', '/dashboard/employee');
    });
});

describe('employee dashboard permissions', () => {
    it('redirects anonymous user', () => {
        cy.intercept('GET', '**/api/users/profile', { statusCode: 401 });
        cy.on('uncaught:exception', () => false);
        cy.visit('/dashboard/employee');
        cy.url().should('include', '/auth/login');
    });
});
