import { mockAdminLogin } from '../support/mockLogin';

describe('navigation visibility', () => {
    describe('authenticated admin', () => {
        beforeEach(() => {
            mockAdminLogin();
            cy.intercept('GET', '/api/products*', {
                fixture: 'products.json',
            });
        });

        it('shows dashboard navigation for authenticated users on /products', () => {
            cy.visit('/products');
            cy.contains('Shampoo');
            cy.contains('Dashboard');
            cy.contains('Products');
        });
    });

    it('redirects unauthenticated users away from /products', () => {
        cy.intercept('GET', '/api/profile', { statusCode: 401 });
        cy.on('uncaught:exception', () => false);
        cy.visit('/products');
        cy.url().should('include', '/auth/login');
    });

    it('renders public navigation on public pages', () => {
        cy.intercept('GET', '/api/services*', { fixture: 'services.json' });
        cy.visit('/services');
        cy.contains('Cut');
        cy.get('nav').contains('Login');
        cy.get('nav').contains('Services');
    });
});
