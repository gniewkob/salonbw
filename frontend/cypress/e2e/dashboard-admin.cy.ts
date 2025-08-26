import { mockAdminLogin } from '../support/mockLogin';

describe('admin dashboard navigation', () => {
    beforeEach(() => {
        mockAdminLogin();
        cy.intercept('GET', '/api/dashboard', { fixture: 'dashboard.json' }).as(
            'dashboard',
        );
    });

    it('redirects to admin dashboard and navigates to employees', () => {
        cy.visit('/dashboard');
        cy.wait('@profile');
        cy.wait('@dashboard');
        cy.url().should('include', '/dashboard/admin');
        cy.contains('Clients');
        cy.intercept('GET', '/api/employees*', {
            fixture: 'employees.json',
        }).as('getEmployees');
        cy.get('[data-testid="nav-employees"]').as('navEmployees');
        cy.get('@navEmployees').click();
        cy.wait('@getEmployees');
        cy.url().should('include', '/employees');
        cy.get('table').should('be.visible');
    });

    it('navigates to employees via sidebar', () => {
        cy.visit('/dashboard/admin');
        cy.wait('@profile');
        cy.wait('@dashboard');
        cy.intercept('GET', '/api/employees*', {
            fixture: 'employees.json',
        }).as('getEmployees');
        cy.get('[data-testid="nav-employees"]').as('navEmployees');
        cy.get('@navEmployees').click();
        cy.wait('@getEmployees');
        cy.url().should('include', '/employees');
        cy.get('table').should('be.visible');
    });
});

describe('admin dashboard services crud', () => {
    beforeEach(() => {
        mockAdminLogin();
        cy.intercept('GET', '/api/services*', { fixture: 'services.json' }).as(
            'getSvc',
        );
    });

    it('creates a service', () => {
        cy.intercept('POST', '/api/services', { id: 3, name: 'Wax' }).as(
            'createSvc',
        );
        cy.visit('/dashboard/services');
        cy.wait('@profile');
        cy.wait('@getSvc');
        cy.contains('Add Service').click();
        cy.get('input[placeholder="Name"]').type('Wax');
        cy.contains('button', 'Save').click();
        cy.wait('@createSvc');
        cy.contains('Wax');
    });
});

describe('admin dashboard permissions', () => {
    it('redirects anonymous user', () => {
        cy.intercept('GET', '/api/profile', { statusCode: 401 });
        cy.on('uncaught:exception', () => false);
        cy.visit('/dashboard/admin');
        cy.url().should('include', '/auth/login');
    });
});
