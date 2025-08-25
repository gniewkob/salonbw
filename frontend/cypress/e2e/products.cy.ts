describe('basic', () => {
    it('loads home', () => {
        cy.visit('/');
        cy.contains('Featured Services');
    });
});
describe('products crud', () => {
    beforeEach(() => {
        localStorage.setItem('jwtToken', 'x');
    });

    it('loads and creates product', () => {
        cy.intercept('GET', '**/api/products/admin', {
            fixture: 'products.json',
        }).as('getProd');
        cy.intercept('POST', '**/api/products/admin', {
            id: 2,
            name: 'New',
            unitPrice: 1,
            stock: 1,
        }).as('createProd');
        cy.visit('/products');
        cy.wait('@getProd');
        cy.contains('Add Product').click();
        cy.get('input[placeholder="Name"]').type('New');
        cy.get('input[placeholder="Price"]').type('1');
        cy.get('input[placeholder="Stock"]').type('1');
        cy.contains('button', 'Save').click();
        cy.wait('@createProd');
        cy.contains('New');
        cy.contains('Product created');
    });
});
