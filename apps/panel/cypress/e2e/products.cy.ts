import { mockAdminLogin } from '../support/mockLogin';

describe('products crud', () => {
    beforeEach(() => {
        mockAdminLogin();
    });

    it('loads and creates product', () => {
        cy.intercept('GET', 'http://localhost:3001/products*', {
            fixture: 'products.json',
        }).as('getProd');
        cy.intercept('POST', 'http://localhost:3001/products', {
            statusCode: 201,
            body: {
                id: 999,
                name: 'New',
                brand: 'B',
                unitPrice: 1,
                stock: 1,
                lowStockThreshold: 5,
            },
        }).as('createProd');
        cy.visit('/products');
        cy.wait('@profile');
        cy.wait('@getProd');
        cy.contains('Add Product', { timeout: 10000 })
            .should('be.visible')
            .click();
        cy.get('input[placeholder="Name"]').type('New');
        cy.get('input[placeholder="Price"]').type('1');
        cy.get('input[placeholder="Stock"]').type('1');
        cy.contains('button', 'Save').click();
        cy.wait('@createProd', { timeout: 10000 });
        cy.contains('New');
        cy.contains('Product created');
    });
});
