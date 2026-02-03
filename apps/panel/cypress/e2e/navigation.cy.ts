import { mockAdminLogin } from '../support/mockLogin';

describe('navigation visibility', () => {
    describe('authenticated admin', () => {
        beforeEach(() => {
            mockAdminLogin();
            cy.intercept('GET', 'http://localhost:3001/products*', {
                fixture: 'products.json',
            }).as('getProd');
        });

        it('shows dashboard navigation for authenticated users on /products', () => {
            cy.visit('/products');
            cy.wait('@profile');
            cy.wait('@getProd');
            cy.contains('Shampoo');
            cy.contains('Dashboard');
            cy.contains('Products');
        });
    });

    it('redirects unauthenticated users away from /products', () => {
        cy.intercept('GET', 'http://localhost:3001/users/profile', {
            statusCode: 401,
        });
        cy.on('uncaught:exception', () => false);
        cy.visit('/products');
        cy.url().should('include', '/auth/login');
    });
});
