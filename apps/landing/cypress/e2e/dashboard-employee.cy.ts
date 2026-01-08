import { mockEmployeeLogin } from '../support/mockLogin';

describe('employee dashboard navigation', () => {
    beforeEach(() => {
        mockEmployeeLogin();
        cy.intercept('GET', '**/appointments/me', []).as('getMine');
    });

    it('redirects to employee dashboard and shows UI', () => {
        cy.visit('/dashboard');
        cy.wait('@profile');
        cy.url().should('include', '/dashboard/employee');
        cy.contains('Salon Black & White').should('be.visible');
        cy.get('.fc', { timeout: 10000 }).should('exist');
    });

    it('does not show admin-only Clients link in sidebar', () => {
        cy.visit('/dashboard/employee');
        cy.wait('@profile');
        cy.wait('@getMine');
        // If mobile menu button exists, open it; otherwise sidebar is already visible
        cy.get('body').then(($body) => {
            const btn = [...$body.find('button')].find((b) =>
                b.textContent?.includes('Open Menu'),
            );
            if (btn) cy.wrap(btn).click({ force: true });
        });
        // Clients is admin-only so it should not be present for employee
        cy.contains('Clients').should('not.exist');
    });
});

describe('employee dashboard clients access', () => {
    it('shows forbidden message on admin-only clients page', () => {
        mockEmployeeLogin();
        cy.visit('/clients');
        cy.wait('@profile');
        cy.contains("You don't have permission to access this area.").should(
            'be.visible',
        );
        cy.location('pathname').should('eq', '/clients');
    });
});

describe('employee dashboard permissions', () => {
    it('redirects anonymous user', () => {
        cy.intercept('GET', '**/users/profile', { statusCode: 401 });
        cy.on('uncaught:exception', () => false);
        cy.visit('/dashboard/employee');
        cy.url().should('include', '/auth/login');
    });
});
