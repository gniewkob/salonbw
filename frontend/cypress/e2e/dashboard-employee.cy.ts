import { mockEmployeeLogin } from '../support/mockLogin';

describe('employee dashboard navigation', () => {
    beforeEach(() => {
        mockEmployeeLogin();
        cy.intercept('GET', '**/api/appointments/me', []).as('getMine');
    });

    it('redirects to employee dashboard and shows UI', () => {
        cy.visit('/dashboard');
        cy.wait('@profile');
        cy.wait('@getMine');
        cy.url().should('include', '/dashboard/employee');
        // Sidebar/Topbar should render
        cy.contains('Dashboard', { timeout: 10000 }).should('be.visible');
        cy.contains('Salon Black & White').should('be.visible');
    });

    it('navigates to clients via sidebar', () => {
        cy.visit('/dashboard/employee');
        cy.wait('@profile');
        cy.wait('@getMine');
        cy.intercept('GET', '**/api/clients', {
            fixture: 'clients.json',
        }).as('getClients');
        // Use generic link search to avoid testid flake
        cy.contains('a', 'Clients', { timeout: 10000 }).click();
        cy.wait('@getClients');
        cy.url().should('include', '/clients');
        cy.get('table', { timeout: 10000 }).should('be.visible');
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
