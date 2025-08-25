import { mockAdminLogin } from '../support/mockLogin';

describe('navigation visibility', () => {
    describe('authenticated admin', () => {
        beforeEach(() => {
            mockAdminLogin();
            cy.intercept('GET', '/api/products/admin', {
                fixture: 'products.json',
            }).as('getProd');
        });

        it('shows dashboard navigation for authenticated users on /products', () => {
            cy.visit('/products');
            cy.wait('@getProd');
            cy.contains('Dashboard');
            cy.contains('Products');
        });
    });

    it('redirects unauthenticated users away from /products', () => {
        cy.visit('/products');
        cy.url().should('include', '/auth/login');
    });

    it('renders public navigation on public pages', () => {
        cy.intercept('GET', '/api/services', { fixture: 'services.json' }).as(
            'getServices',
        );
        cy.visit('/services');
        cy.wait('@getServices');
        cy.get('nav').contains('Login');
        cy.get('nav').contains('Services');
    });
});
