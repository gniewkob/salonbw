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

    it('navigates to clients via sidebar and gets redirected back', () => {
        cy.visit('/dashboard/employee');
        cy.wait('@profile');
        cy.wait('@getMine');
        // If mobile menu button exists, open it; otherwise sidebar is already visible
        cy.get('button').then(($btns) => {
            const btn = [...$btns].find((b) => b.textContent?.includes('Open Menu'));
            if (btn) cy.wrap(btn).click({ force: true });
        });
        // Sidebar link exists but Clients page is admin-only
        cy.contains('Clients', { timeout: 10000 }).click({ force: true });
        // RouteGuard should bring us back to employee dashboard
        cy.url({ timeout: 10000 }).should('include', '/dashboard/employee');
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
